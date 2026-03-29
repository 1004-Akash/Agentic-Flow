from fastapi import FastAPI, HTTPException, Body, UploadFile, File, WebSocket, WebSocketDisconnect
import json
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import uuid
import asyncio
from datetime import datetime
import os
from dotenv import load_dotenv

from db.database import tasks_collection, logs_collection, reports_collection, transcripts_collection, meetings_collection, initialize_db, new_joinees_collection
from models.schemas import MeetingInput, Task, TaskBase, LogEntry, Report, MeetingModel, TranscriptModel
from agents.workflow import workflow_app, onboarding_workflow_app, sla_workflow_app
from agents.bot_agent import bot

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
    # Start the Telegram Bot in the background
    asyncio.create_task(bot.run())

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

@app.post("/onboarding")
async def trigger_onboarding(payload: dict = Body(...)):
    # Accept both { data: {...} } and flat { name, role, department } shapes
    data = payload.get("data", payload)
    
    name = data.get("name", "New Associate")
    role = data.get("role", "Engineer")
    department = data.get("department", "Engineering")
    email = data.get("email", "test111723201002@gmail.com")
    
    workflow_id = str(uuid.uuid4())
    print(f"\n[SYSTEM] Triggering ONBOARDING workflow: {workflow_id} for {name}")
    
    # Persistent storage of the new enrollment with structured fields
    await new_joinees_collection.insert_one({
        "workflow_id": workflow_id,
        "name": name,
        "role": role,
        "department": department,
        "email": email,
        "timestamp": datetime.now(),
        "status": "processing"
    })
    
    # Build natural language input for LangGraph agent
    text = f"{name} is joining as a {role} in the {department} team. Please initiate the standard onboarding protocol."
    
    config = {"configurable": {"thread_id": workflow_id}}
    initial_state = {
        "text": text,
        "onboarding_id": workflow_id,
        "status": "started",
        "next_action": "culture"
    }
    
    try:
        asyncio.create_task(onboarding_workflow_app.ainvoke(initial_state, config=config))
        return {"status": "success", "workflow_id": workflow_id, "message": f"Onboarding initiated for {name}"}
    except Exception as e:
        print(f"[SYSTEM] !!! Onboarding workflow error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/employee-check")
async def employee_check(payload: dict = Body({})):
    email        = payload.get("email", "test111723201002@gmail.com")
    name         = payload.get("name", "New Associate")
    role         = payload.get("role", "Software Engineer")
    department   = payload.get("department", "AI")
    joining_date = payload.get("joining_date", "2026-04-01")
    manager      = payload.get("manager", "Jane Smith")
    
    print(f"\n[SYSTEM] Employee check-in: {name} | {role} | {department} | {email}")
    
    # Convert date from yyyy-mm-dd (HTML input) → dd-mm-yyyy for storage
    def fmt_date(d):
        try:
            parts = d.split("-")
            if len(parts) == 3 and len(parts[0]) == 4:
                # yyyy-mm-dd → dd-mm-yyyy
                return f"{parts[2]}-{parts[1]}-{parts[0]}"
            return d  # already in correct format or empty
        except:
            return d

    record_id = str(uuid.uuid4())[:8].upper()
    now = datetime.now()

    # Store full profile in MongoDB — fields match the form exactly
    join_doc = {
        "record_id":         record_id,           # e.g. "A1B2C3D4"
        "full_name":         name,                # Full Name *
        "job_role":          role,                # Job Role
        "department":        department,          # Department
        "joining_date":      fmt_date(joining_date),  # dd-mm-yyyy
        "reporting_manager": manager,             # Reporting Manager
        "email":             email,               # Provisioned Email
        "portal_source":     "new_joinee_portal", # Origin
        "onboarded_at":      now.strftime("%d-%m-%Y %H:%M:%S"),
        "status":            "onboarded",
        "welcome_email_sent": False,
        "telegram_buddy":    "https://t.me/AgenticFlowBuddyAI_bot"
    }
    result = await new_joinees_collection.insert_one(join_doc)
    print(f"[MONGODB] Inserted new joinee record_id={record_id} | _id={result.inserted_id}")
    
    # Build rich welcome email
    html_email = f"""
    <!DOCTYPE html>
    <html>
    <head>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 0; }}
        .wrapper {{ max-width: 620px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #4f46e5 0%, #1d4ed8 100%); padding: 50px 40px; text-align: center; }}
        .header h1 {{ color: white; margin: 0; font-size: 28px; font-weight: 800; }}
        .header p {{ color: rgba(255,255,255,0.75); margin: 10px 0 0; font-size: 14px; }}
        .body {{ padding: 44px 40px; }}
        .greeting {{ font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 14px; }}
        .text {{ font-size: 15px; color: #475569; line-height: 1.7; margin-bottom: 28px; }}
        .profile-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }}
        .profile-item {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; }}
        .profile-label {{ font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8; margin-bottom: 4px; }}
        .profile-value {{ font-size: 15px; font-weight: 600; color: #1e293b; }}
        .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px 24px; margin-bottom: 18px; }}
        .card-title {{ font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #64748b; margin-bottom: 10px; }}
        .chip {{ display: inline-block; background: #e0e7ff; color: #4338ca; padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; margin: 3px 3px 0 0; }}
        .btn {{ display: block; background: linear-gradient(135deg, #4f46e5, #1d4ed8); color: white !important; text-decoration: none; text-align: center; padding: 18px 32px; border-radius: 14px; font-weight: 800; font-size: 15px; margin: 28px 0; }}
        .divider {{ border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }}
        .footer {{ background: #0f172a; padding: 26px 40px; text-align: center; color: #475569; font-size: 12px; }}
        .footer strong {{ color: #6366f1; }}
    </style>
    </head>
    <body>
    <div class="wrapper">
        <div class="header">
            <h1>🚀 Welcome to AgenticFlow, {name}!</h1>
            <p>Your intelligent onboarding journey begins now · Initiated by AgenticFlow AI</p>
        </div>
        <div class="body">
            <div class="greeting">Hello, {name}! 👋</div>
            <p class="text">
                We're thrilled to have you join the <strong>{department}</strong> team as <strong>{role}</strong>!
                Your onboarding has been fully orchestrated by our autonomous multi-agent AI system.
                Everything has been provisioned and your tools are ready to go.
            </p>

            <div class="card">
                <div class="card-title">👤 Your Employee Profile</div>
                <div class="profile-grid">
                    <div class="profile-item">
                        <div class="profile-label">Full Name</div>
                        <div class="profile-value">{name}</div>
                    </div>
                    <div class="profile-item">
                        <div class="profile-label">Role</div>
                        <div class="profile-value">{role}</div>
                    </div>
                    <div class="profile-item">
                        <div class="profile-label">Department</div>
                        <div class="profile-value">{department}</div>
                    </div>
                    <div class="profile-item">
                        <div class="profile-label">Joining Date</div>
                        <div class="profile-value">{joining_date}</div>
                    </div>
                    <div class="profile-item">
                        <div class="profile-label">Reporting Manager</div>
                        <div class="profile-value">{manager}</div>
                    </div>
                    <div class="profile-item">
                        <div class="profile-label">Provisioned Email</div>
                        <div class="profile-value" style="font-size:13px;">{email}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-title">🛠️ Tool Access Provisioned</div>
                <span class="chip">✅ Slack</span>
                <span class="chip">✅ JIRA</span>
                <span class="chip">✅ Corporate Email</span>
                <span class="chip">✅ GitHub</span>
                <span class="chip">✅ Confluence</span>
            </div>

            <div class="card">
                <div class="card-title">📅 Orientation Schedule</div>
                <div style="font-size:14px; color:#475569;">
                    Your orientation with <strong style="color:#1e293b;">{manager}</strong> is scheduled within <strong style="color:#1e293b;">48 hours of {joining_date}</strong>.
                    A calendar invite will be sent to your corporate inbox shortly.
                </div>
            </div>

            <div class="card">
                <div class="card-title">📦 Welcome Pack Includes</div>
                <div style="font-size:14px; color:#475569; line-height: 1.8;">
                    ✅ Company Handbook &amp; Culture Guide<br>
                    ✅ Hardware Setup Instructions<br>
                    ✅ Direct Access Links Dashboard<br>
                    ✅ {department} Team Onboarding Checklist
                </div>
            </div>

            <a href="https://t.me/AgenticFlowBuddyAI_bot" class="btn">
                🤖 Connect with Your AI Buddy on Telegram
            </a>

            <p style="font-size: 13px; text-align: center; color: #94a3b8; margin-top: -16px;">
                @AgenticFlowBuddyAI_bot — available 24/7 for policy Q&amp;A and onboarding guidance.
            </p>

            <hr class="divider">

            <p style="font-size: 15px; color: #475569;">
                Looking forward to your journey with us, {name}!<br><br>
                Warm regards,<br>
                <strong style="color: #1e293b;">AgenticFlow People Operations</strong><br>
                <span style="font-size: 12px; color: #94a3b8;">Powered by Autonomous Multi-Agent Orchestration</span>
            </p>
        </div>
        <div class="footer">
            © 2026 <strong>AgenticFlow</strong> | Autonomous Enterprise Onboarding System<br>
            This email was generated and dispatched by the AgenticFlow AI pipeline.
        </div>
    </div>
    </body>
    </html>
    """
    
    import aiohttp
    email_sent = False
    async with aiohttp.ClientSession() as session:
        try:
            resp = await session.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": "Bearer re_VzHmzh5R_yehgFQzdqdGhw3zp4ZVn6e16",
                    "Content-Type": "application/json"
                },
                json={
                    "from": "onboarding@resend.dev",
                    "to": ["test111723201002@gmail.com"],
                    "subject": f"🚀 Welcome to AgenticFlow, {name}! Your {role} Onboarding Pack is Ready",
                    "html": html_email
                }
            )
            response_text = await resp.text()
            print(f"[RESEND] Status: {resp.status} | Response: {response_text}")
            if resp.status in [200, 201]:
                email_sent = True
                await new_joinees_collection.update_one(
                    {"_id": result.inserted_id},
                    {"$set": {"welcome_email_sent": True}}
                )
        except Exception as e:
            print(f"[RESEND ERROR] {str(e)}")
    
    return {
        "status": "success",
        "email": email,
        "name": name,
        "role": role,
        "department": department,
        "welcome_email_sent": email_sent,
        "welcome_pack": "sent"
    }



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
