from fastapi import FastAPI, HTTPException, Body, UploadFile, File, WebSocket, WebSocketDisconnect
import json
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import uuid
import asyncio
from datetime import datetime
import os
from dotenv import load_dotenv

from db.database import tasks_collection, logs_collection, reports_collection, transcripts_collection, meetings_collection, initialize_db
from models.schemas import MeetingInput, Task, TaskBase, LogEntry, Report, MeetingModel, TranscriptModel
from agents.workflow import workflow_app, onboarding_workflow_app, sla_workflow_app

load_dotenv()

app = FastAPI(title="Agentic AI Workflow Automation System (with Meeting Capture)")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await initialize_db()

# MEETING ENDPOINTS
@app.post("/start-meeting")
async def start_meeting(title: str = "Live Meeting"):
    meeting_id = str(uuid.uuid4())
    meeting_doc = {
        "meeting_id": meeting_id,
        "title": title,
        "status": "active",
        "created_at": datetime.now()
    }
    await meetings_collection.insert_one(meeting_doc)
    return {"meeting_id": meeting_id, "status": "active"}

# WebSocket Connection Manager for Multi-User Meetings
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[dict]] = {}  # meeting_id -> [{ws, user}]

    async def connect(self, ws: WebSocket, meeting_id: str, user_name: str):
        await ws.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = []
        self.active_connections[meeting_id].append({"ws": ws, "user": user_name})
        await self.broadcast_users(meeting_id)

    def disconnect(self, ws: WebSocket, meeting_id: str):
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id] = [c for c in self.active_connections[meeting_id] if c["ws"] != ws]
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]

    async def broadcast(self, message: dict, meeting_id: str):
        if meeting_id in self.active_connections:
            for conn in self.active_connections[meeting_id]:
                try:
                    await conn["ws"].send_json(message)
                except: pass

    async def broadcast_users(self, meeting_id: str):
        if meeting_id in self.active_connections:
            users = [c["user"] for c in self.active_connections[meeting_id]]
            await self.broadcast({"type": "users", "users": users}, meeting_id)

manager = ConnectionManager()

@app.websocket("/ws/{meeting_id}/{user_name}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str, user_name: str):
    await manager.connect(websocket, meeting_id, user_name)
    try:
        while True:
            data = await websocket.receive_text()
            transcript_doc = {
                "id": str(uuid.uuid4()),
                "meeting_id": meeting_id,
                "text": data,
                "user": user_name,
                "timestamp": datetime.now()
            }
            await transcripts_collection.insert_one(transcript_doc)
            await manager.broadcast({
                "type": "transcript",
                "text": data,
                "user": user_name
            }, meeting_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, meeting_id)
        await manager.broadcast_users(meeting_id)

@app.post("/audio")
async def upload_audio(meeting_id: str, text: str = Body(..., embed=True)):
    # In a full Whisper implementation, we'd receive binary audio and transcribe it.
    # For now, we'll assume the client is capture live text (using Web Speech API) or sending audio to a Whisper API wrapper.
    # Here, we persist the transcript.
    transcript_doc = {
        "id": str(uuid.uuid4()),
        "meeting_id": meeting_id,
        "text": text,
        "timestamp": datetime.now()
    }
    await transcripts_collection.insert_one(transcript_doc)
    return {"status": "received", "transcript_id": transcript_doc["id"]}

@app.get("/transcript")
async def get_transcript(meeting_id: str):
    cursor = transcripts_collection.find({"meeting_id": meeting_id}).sort("timestamp", 1)
    transcripts = await cursor.to_list(length=100)
    full_text = " ".join([t["text"] for t in transcripts])
    return {"meeting_id": meeting_id, "text": full_text, "segments": transcripts}

# WORKFLOW ENDPOINTS
@app.post("/onboarding")
async def process_onboarding(text: str = Body(..., embed=True)):
    workflow_id = str(uuid.uuid4())
    print(f"\n[SYSTEM] Received Onboarding text for Workflow ID: {workflow_id}")
    state = {
        "workflow_id": workflow_id,
        "input_text": text,
        "jira_retries": 0,
        "escalated": False,
        "logs": []
    }
    try:
        result_state = await onboarding_workflow_app.ainvoke(state)
        # Format output exactly to specification
        output = {
            "new_hire": result_state.get('employee_name', 'Unknown'),
            "tasks": result_state.get('tasks_status', []),
            "buddy_assigned": result_state.get('buddy', None),
            "orientation_scheduled": result_state.get('orientation_scheduled', False),
            "welcome_pack_sent": result_state.get('welcome_pack_sent', False)
        }
        print(f"\n[OUTPUT] {json.dumps(output, indent=2)}")
        # Merge workflow_id into output so frontend might optionally use it, though returning exactly what was requested.
        return output
    except Exception as e:
        print(f"[SYSTEM] !!! Onboarding workflow error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sla-breach")
async def process_sla(text: str = Body(..., embed=True)):
    workflow_id = str(uuid.uuid4())
    print(f"\n[SYSTEM] Received SLA Breach text for Workflow ID: {workflow_id}")
    state = {
        "workflow_id": workflow_id,
        "input_text": text,
        "logs": []
    }
    try:
        await sla_workflow_app.ainvoke(state)
        return {"workflow_id": workflow_id, "status": "completed"}
    except Exception as e:
        print(f"[SYSTEM] !!! SLA workflow error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/meeting-text")
async def process_meeting_text(meeting: MeetingInput):
    workflow_id = str(uuid.uuid4())
    print(f"\n[SYSTEM] Received Meeting Text for Workflow ID: {workflow_id}")
    print(f"[SYSTEM] Input Text Length: {len(meeting.text)} chars")
    print(f"[SYSTEM] Initializing Multi-Agent Neural Pipeline...")
    
    initial_state = {
        "meeting_text": meeting.text,
        "email": meeting.email,
        "workflow_id": workflow_id,
        "tasks": [],
        "logs": [],
        "report": {},
        "errors": []
    }
    
    try:
        # Run LangGraph workflow asynchronously
        result_state = await workflow_app.ainvoke(initial_state)
        print(f"[SYSTEM] Workflow {workflow_id} processing finalized successfully.")
        return {
            "workflow_id": workflow_id,
            "tasks": result_state.get("tasks", []),
            "report": result_state.get("report", {})
        }
    except Exception as e:
        print(f"[SYSTEM] !!! Workflow error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks")
async def get_tasks():
    cursor = tasks_collection.find().sort("created_at", -1)
    tasks = await cursor.to_list(length=100)
    for task in tasks:
        task["_id"] = str(task["_id"])
    return tasks

@app.post("/update-task")
async def update_task(task_id: str, updates: Dict[str, Any]):
    from bson import ObjectId
    res = await tasks_collection.update_one({"_id": ObjectId(task_id)}, {"$set": updates})
    if res.modified_count:
        return {"status": "success"}
    return {"status": "no change"}

@app.get("/logs")
async def get_logs(workflow_id: str = None):
    query = {}
    if workflow_id:
        query = {"workflow_id": workflow_id}
    cursor = logs_collection.find(query).sort("timestamp", -1)
    logs = await cursor.to_list(length=100)
    for log in logs:
        log["_id"] = str(log["_id"])
        if isinstance(log.get("result"), dict) and "_id" in log["result"]:
            log["result"]["_id"] = str(log["result"]["_id"])
    return logs

@app.get("/report")
async def get_report(workflow_id: str = None):
    query = {}
    if workflow_id:
        query = {"workflow_id": workflow_id}
    report = await reports_collection.find_one(query, sort=[("created_at", -1)])
    if report:
        report["_id"] = str(report["_id"])
    return report

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
