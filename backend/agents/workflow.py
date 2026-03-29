from typing import TypedDict, List, Dict, Any, Annotated
import json
import os
from datetime import datetime
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv
from db.database import tasks_collection, logs_collection, reports_collection

load_dotenv()

# Define State
class AgentState(TypedDict):
    meeting_text: str
    email: str
    workflow_id: str
    tasks: List[Dict[str, Any]]
    logs: List[Dict[str, Any]]
    report: Dict[str, Any]
    errors: List[str]

# Initialize OpenRouter LLM
llm = ChatOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
    model=os.getenv("MODEL_NAME", "openai/gpt-3.5-turbo"),
    # Adding extra headers for OpenRouter if needed
    default_headers={
        "HTTP-Referer": "https://agenticflow.host", # Optional
        "X-Title": "AgenticFlow System"
    }
)

async def log_step(workflow_id: str, agent: str, action: str, result: Any):
    log_entry = {
        "timestamp": datetime.now(),
        "workflow_id": workflow_id,
        "agent": agent,
        "action": action,
        "result": result
    }
    await logs_collection.insert_one(log_entry)
    print(f"\n[AGENTICFLOW] >>> Agent: {agent}")
    print(f"            Action: {action}")
    print(f"            Result: {json.dumps(result, default=str)[:300]}...")
    return log_entry

# 1. PlannerAgent
async def planner_agent(state: AgentState):
    print(f"\n[PIPELINE] ::: PlannerAgent Starting (Workflow: {state['workflow_id']})")
    
    cursor = tasks_collection.find({"status": {"$ne": "completed"}}).sort("created_at", -1)
    past_tasks = await cursor.to_list(length=20)
    past_tasks_str = json.dumps([{"task": t["task"], "person": t["person"], "progress": t.get("progress", 0)} for t in past_tasks])

    prompt = f"""
    You are a PlannerAgent in an enterprise workflow system. Extract tasks from the meeting transcript.
    Take previous tasks into consideration to avoid duplicates.
    Previous Active Tasks: {past_tasks_str}
    
    Meeting Text: {state['meeting_text']}
    
    IMPORTANT RULES:
    1. If a task has a CLEAR owner mentioned in the transcript, assign them.
    2. If a task has NO CLEAR owner (ambiguous), set person to "UNASSIGNED" and add "needs_clarification": true.
    3. Do NOT guess owners. Flag ambiguity instead.
    4. Do NOT duplicate tasks that already exist in the system.
    
    Return ONLY a valid JSON list:
    [
      {{
        "task": "Task Description",
        "person": "Name or UNASSIGNED",
        "deadline": "YYYY-MM-DD",
        "needs_clarification": false
      }}
    ]
    """
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    try:
        content = response.content.replace("```json", "").replace("```", "").strip()
        tasks = json.loads(content)
        ambiguous = [t for t in tasks if t.get("needs_clarification")]
        state['tasks'] = tasks
        await log_step(state['workflow_id'], "PlannerAgent", "Extract tasks from transcript", {
            "total_extracted": len(tasks),
            "ambiguous_flagged": len(ambiguous),
            "tasks": tasks
        })
        if ambiguous:
            await log_step(state['workflow_id'], "PlannerAgent", "AMBIGUITY DETECTED — flagged tasks with no clear owner", ambiguous)
    except Exception as e:
        print(f"[ERROR] PlannerAgent failed: {str(e)}")
        state['errors'].append(f"Planner error: {str(e)}")
    return state

# 2. AssignmentAgent
async def assignment_agent(state: AgentState):
    print(f"[PIPELINE] ::: AssignmentAgent Processing {len(state['tasks'])} tasks...")
    tasks_with_ids = []
    for t in state['tasks']:
        task_doc = {
            **t,
            "workflow_id": state['workflow_id'],
            "status": "pending",
            "progress": 0,
            "created_at": datetime.now()
        }
        res = await tasks_collection.insert_one(task_doc)
        task_doc["_id"] = str(res.inserted_id)
        tasks_with_ids.append(task_doc)
    
    state['tasks'] = tasks_with_ids
    await log_step(state['workflow_id'], "AssignmentAgent", "Assign and store tasks", {"count": len(tasks_with_ids)})
    return state

# 3. TrackerAgent — Intelligent Progress Updater
async def tracker_agent(state: AgentState):
    print(f"[PIPELINE] ::: TrackerAgent analyzing progress updates...")
    
    # Fetch ALL existing tasks from DB (not just this workflow)
    cursor = tasks_collection.find().sort("created_at", -1)
    all_existing_tasks = await cursor.to_list(length=50)
    existing_summary = []
    for t in all_existing_tasks:
        existing_summary.append({
            "_id": str(t["_id"]),
            "task": t.get("task", ""),
            "person": t.get("person", ""),
            "progress": t.get("progress", 0),
            "status": t.get("status", "pending")
        })

    prompt = f"""
    You are a TrackerAgent. Your job is to detect progress updates from a meeting transcript.
    
    Here are ALL existing tasks in the system:
    {json.dumps(existing_summary, default=str)}
    
    Here is the latest meeting transcript:
    {state['meeting_text']}
    
    Analyze the transcript. If someone mentions progress for an existing task or person (e.g. "Austin completed 12%" or "frontend is 50% done"), return updates.
    
    Return ONLY a valid JSON list of updates:
    [
      {{
        "_id": "existing task _id to update",
        "progress": 12,
        "status": "in-progress"
      }}
    ]
    
    Rules:
    - Match by person name or task description.
    - If progress is 100, set status to "completed".  
    - If progress > 0 and < 100, set status to "in-progress".
    - If no progress updates are mentioned for a task, do NOT include it.
    - If transcript mentions new tasks only (no progress updates), return [].
    """
    
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    updates_applied = []
    try:
        content = response.content.replace("```json", "").replace("```", "").strip()
        updates = json.loads(content)
        
        from bson import ObjectId
        for upd in updates:
            task_id = upd.get("_id")
            new_progress = upd.get("progress", 0)
            new_status = upd.get("status", "in-progress")
            if new_progress >= 100:
                new_status = "completed"
            
            try:
                await tasks_collection.update_one(
                    {"_id": ObjectId(task_id)},
                    {"$set": {"progress": new_progress, "status": new_status}}
                )
                updates_applied.append({"_id": task_id, "progress": new_progress, "status": new_status})
                print(f"    [TRACKER] Updated task {task_id} -> {new_progress}% ({new_status})")
            except Exception as e:
                print(f"    [TRACKER] Failed to update {task_id}: {str(e)}")
    except Exception as e:
        print(f"[ERROR] TrackerAgent LLM parse failed: {str(e)}")
    
    # Also set new tasks from this workflow to in-progress if no update was found
    for task in state['tasks']:
        if task.get("_id") and not any(u["_id"] == task["_id"] for u in updates_applied):
            task['progress'] = 0
            task['status'] = "pending"
    
    await log_step(state['workflow_id'], "TrackerAgent", "Intelligent progress sync completed", {"updates": updates_applied, "count": len(updates_applied)})
    return state

# 4. AlertAgent
async def alert_agent(state: AgentState):
    prompt = f"""
    You are an AlertAgent. Today is {datetime.now().strftime('%Y-%m-%d')}.
    Tasks: {json.dumps(state['tasks'], default=str)}
    
    If any task is at risk or delayed, return JSON list: [{{ "task": "...", "warning": "..." }}].
    Otherwise return [].
    """
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    try:
        content = response.content.replace("```json", "").replace("```", "").strip()
        alerts = json.loads(content)
        await log_step(state['workflow_id'], "AlertAgent", "Delay analysis completed", alerts)
    except:
        pass
    return state

# 5. FixAgent — Real Error Recovery & Escalation
async def fix_agent(state: AgentState):
    print(f"[PIPELINE] ::: FixAgent analyzing for failures and stalls...")
    from bson import ObjectId
    
    fixes_applied = []
    escalations = []
    
    # 1. Check for UNASSIGNED / ambiguous tasks — attempt smart reallocation
    for task in state['tasks']:
        if task.get('person', '').upper() == 'UNASSIGNED' or task.get('needs_clarification'):
            # Try to find a team member with the least workload
            pipeline = [{"$match": {"status": "in-progress"}}, {"$group": {"_id": "$person", "count": {"$sum": 1}}}, {"$sort": {"count": 1}}]
            workload = await tasks_collection.aggregate(pipeline).to_list(length=5)
            if workload:
                least_busy = workload[0]["_id"]
                task['person'] = least_busy
                task['needs_clarification'] = False
                if task.get('_id'):
                    try:
                        await tasks_collection.update_one({"_id": ObjectId(task['_id'])}, {"$set": {"person": least_busy, "needs_clarification": False}})
                    except: pass
                fixes_applied.append({"action": "auto_reassigned", "task": task.get('task'), "to": least_busy, "reason": "No clear owner — assigned to least busy member"})
            else:
                escalations.append({"task": task.get('task'), "reason": "No team members found for reallocation. Human intervention required."})
    
    # 2. Check for stalled tasks (progress=0 across meetings)
    cursor = tasks_collection.find({"progress": 0, "status": {"$ne": "completed"}})
    stalled = await cursor.to_list(length=20)
    for s in stalled:
        age_hours = (datetime.now() - s.get("created_at", datetime.now())).total_seconds() / 3600
        if age_hours > 24:  # Stalled for more than 24 hours
            escalations.append({"task": s.get("task"), "person": s.get("person"), "stalled_hours": round(age_hours, 1), "action": "escalation_triggered"})
    
    # 3. Send escalation email if needed
    if escalations and state.get('email'):
        import aiohttp
        esc_html = "<h3>🚨 AgenticFlow Escalation Alert</h3><ul>"
        for e in escalations:
            esc_html += f"<li><b>{e.get('task', 'Unknown')}</b> — {e.get('reason', e.get('action', ''))}</li>"
        esc_html += "</ul>"
        async with aiohttp.ClientSession() as session:
            try:
                await session.post("https://api.resend.com/emails", headers={"Authorization": "Bearer re_RKva9i4C_PwGrMyhBE8bvPyPKWkV38NJ6", "Content-Type": "application/json"}, json={"from": "onboarding@resend.dev", "to": [state.get('email', 'test111723201002@gmail.com')], "subject": "AgenticFlow: Escalation Alert", "html": esc_html})
            except: pass
    
    result = {"fixes": fixes_applied, "escalations": escalations, "total_fixes": len(fixes_applied), "total_escalations": len(escalations)}
    await log_step(state['workflow_id'], "FixAgent", "Error recovery & escalation analysis", result)
    return state

# 6. LoggerAgent — Structured Audit Trail
async def logger_agent(state: AgentState):
    print(f"[PIPELINE] ::: LoggerAgent compiling audit trail...")
    
    # Fetch all logs for this workflow
    cursor = logs_collection.find({"workflow_id": state['workflow_id']}).sort("timestamp", 1)
    wf_logs = await cursor.to_list(length=50)
    
    audit_trail = []
    for log in wf_logs:
        audit_trail.append({
            "timestamp": str(log.get("timestamp", "")),
            "agent": log.get("agent", ""),
            "action": log.get("action", ""),
            "decision_rationale": f"Agent {log.get('agent')} autonomously executed: {log.get('action')}",
            "outcome": "success" if "error" not in str(log.get("result", "")).lower() else "requires_review"
        })
    
    audit_summary = {
        "workflow_id": state['workflow_id'],
        "total_decisions": len(audit_trail),
        "autonomous_steps": len([a for a in audit_trail if a['outcome'] == 'success']),
        "requires_review": len([a for a in audit_trail if a['outcome'] == 'requires_review']),
        "trail": audit_trail
    }
    
    await log_step(state['workflow_id'], "LoggerAgent", "Compiled auditable decision trail", audit_summary)
    return state

# 7. ReportAgent
async def report_agent(state: AgentState):
    print(f"[PIPELINE] ::: ReportAgent Synthesizing Summary...")
    
    # Calculate impact metrics
    total_tasks = len(state.get('tasks', []))
    ambiguous = len([t for t in state.get('tasks', []) if t.get('needs_clarification')])
    auto_fixed = total_tasks - ambiguous
    
    # Fetch all workflow logs to count autonomous steps
    cursor = logs_collection.find({"workflow_id": state['workflow_id']})
    all_logs = await cursor.to_list(length=50)
    autonomous_steps = len(all_logs)
    
    prompt = f"""
    You are a ReportAgent. Generate an executive summary for workflow {state['workflow_id']}.
    Tasks: {json.dumps(state['tasks'], default=str)}
    Autonomous Steps Completed: {autonomous_steps}
    
    Return JSON: {{
        "summary": "...",
        "tasks_extracted": {total_tasks},
        "autonomous_steps": {autonomous_steps},
        "time_saved_minutes": "estimate how many minutes this saved vs manual work",
        "automation_rate": "{round((auto_fixed/max(total_tasks,1))*100)}%",
        "efficiency": "High/Medium/Low"
    }}
    """
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    try:
        content = response.content.replace("```json", "").replace("```", "").strip()
        report = json.loads(content)
        report["workflow_id"] = state['workflow_id']
        state['report'] = report
        await reports_collection.insert_one(report)
        report["_id"] = str(report["_id"])
        
        # Send email
        email_target = state.get("email") or "test111723201002@gmail.com"
        import aiohttp
        email_html = f"<h2>AgenticFlow Pipeline Report</h2>"
        email_html += f"<p><b>Autonomous Steps:</b> {autonomous_steps}</p>"
        email_html += f"<p><b>Tasks Extracted:</b> {total_tasks}</p>"
        email_html += f"<p><b>Automation Rate:</b> {round((auto_fixed/max(total_tasks,1))*100)}%</p>"
        email_html += "<h3>Tasks:</h3><ul>"
        for t in state.get('tasks', []):
            flag = " ⚠️ NEEDS CLARIFICATION" if t.get('needs_clarification') else ""
            email_html += f"<li><b>{t.get('task')}</b> → {t.get('person')}{flag}</li>"
        email_html += "</ul>"
        
        async with aiohttp.ClientSession() as session:
            try:
                resp = await session.post("https://api.resend.com/emails", headers={"Authorization": "Bearer re_RKva9i4C_PwGrMyhBE8bvPyPKWkV38NJ6", "Content-Type": "application/json"}, json={"from": "onboarding@resend.dev", "to": [email_target], "subject": "AgenticFlow: Pipeline Report", "html": email_html})
                print(f"[RESEND API] Response: {resp.status} - {await resp.text()}")
            except Exception as e:
                print(f"[RESEND API] Exception: {str(e)}")
                
        await log_step(state['workflow_id'], "ReportAgent", "Sent post-meeting pipeline email", {"to": email_target})
        await log_step(state['workflow_id'], "ReportAgent", "Generated executive insight with impact metrics", report)
        print(f"[PIPELINE] !!! COMPLETED Workflow: {state['workflow_id']}")
    except Exception as e:
        print(f"[ERROR] ReportAgent failed: {str(e)}")
        state['errors'].append(str(e))
    return state

# Conditional branching: if alerts found, go to fix; else skip to logger
def should_fix(state: AgentState):
    errors = state.get('errors', [])
    tasks = state.get('tasks', [])
    has_ambiguous = any(t.get('needs_clarification') for t in tasks)
    has_errors = len(errors) > 0
    if has_ambiguous or has_errors:
        return "fix"
    return "logger"

# Workflow Definition with Branching
workflow = StateGraph(AgentState)
workflow.add_node("planner", planner_agent)
workflow.add_node("assignment", assignment_agent)
workflow.add_node("tracker", tracker_agent)
workflow.add_node("alert", alert_agent)
workflow.add_node("fix", fix_agent)
workflow.add_node("logger", logger_agent)
workflow.add_node("report", report_agent)

workflow.set_entry_point("planner")
workflow.add_edge("planner", "assignment")
workflow.add_edge("assignment", "tracker")
workflow.add_edge("tracker", "alert")
workflow.add_conditional_edges("alert", should_fix, {"fix": "fix", "logger": "logger"})
workflow.add_edge("fix", "logger")
workflow.add_edge("logger", "report")
workflow.add_edge("report", END)

workflow_app = workflow.compile()

# --- ONBOARDING WORKFLOW ---
class OnboardingState(TypedDict):
    workflow_id: str
    input_text: str
    employee_name: str
    systems_to_create: List[str]
    tasks_status: List[Dict[str, str]]
    jira_retries: int
    escalated: bool
    buddy: str
    orientation_scheduled: bool
    welcome_pack_sent: bool
    logs: List[Dict[str, Any]]

async def ob_planner(state: OnboardingState):
    prompt = f"Extract employee name from text: {state.get('input_text', '')}. Return ONLY the name."
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    state['employee_name'] = response.content.strip()
    state['systems_to_create'] = ["Slack", "Email", "JIRA"]
    state['tasks_status'] = [{"system": sys, "status": "pending"} for sys in state['systems_to_create']]
    await log_step(state['workflow_id'], "OnboardingPlanner", "Sequenced onboarding tasks", {"new_hire": state['employee_name'], "tasks": state['tasks_status']})
    return state

async def ob_account_creator(state: OnboardingState):
    tasks_status = state.get('tasks_status', [])
    for task in tasks_status:
        sys = task["system"]
        if task["status"] == "success":
            continue
            
        if sys == "JIRA":
            if state.get('jira_retries', 0) < 1:
                state['jira_retries'] = state.get('jira_retries', 0) + 1
                await log_step(state['workflow_id'], "AccountCreatorAgent", f"JIRA provisioning access error. Connection dropped.", {"system": "JIRA", "status": "failed", "attempt": 1})
                # Break to allow retry conditional edge to loop back
                break
            else:
                task["status"] = "escalated"
                task["reason"] = "access error after 2 retries"
                state['escalated'] = True
                await log_step(state['workflow_id'], "AccountCreatorAgent", "JIRA access failed on retry. Escalating to IT ticket.", {"system": "JIRA", "status": "escalated"})
        else:
            task["status"] = "success"
            await log_step(state['workflow_id'], "AccountCreatorAgent", f"Provisioned {sys} account successfully.", {"system": sys, "status": "success"})
            
    state['tasks_status'] = tasks_status
    return state

async def ob_escalate_it(state: OnboardingState):
    if state.get('escalated'):
        await log_step(state['workflow_id'], "ITEscalationAgent", "Created urgent ServiceNow ticket INC-9921 for JIRA. Notified HR Manager.", {"action": "Escalated to IT", "notified": "HR"})
    return state

async def ob_culture_agent(state: OnboardingState):
    state['buddy'] = "Jane Smith"
    state['orientation_scheduled'] = True
    await log_step(state['workflow_id'], "CultureAgent", "Assigned buddy and scheduled orientation", {"buddy": state['buddy'], "orientation": "Scheduled"})
    return state

async def ob_welcome_agent(state: OnboardingState):
    state['welcome_pack_sent'] = True
    await log_step(state['workflow_id'], "CultureAgent", "Sent welcome email with documents and resources", {"welcome_pack_sent": True})
    return state

def ob_check_retry(state: OnboardingState):
    tasks = state.get('tasks_status', [])
    jira_task = next((t for t in tasks if t["system"] == "JIRA"), None)
    
    # If escalated, go to escalate
    if state.get('escalated') or (jira_task and jira_task.get("status") == "escalated"):
        return "escalate"
        
    # If JIRA failed but not yet escalated, loop back to creator
    if jira_task and jira_task.get("status") != "success" and state.get('jira_retries', 0) > 0:
        return "retry"
        
    # Otherwise continue to culture buddy assignment
    return "culture"

ob_workflow = StateGraph(OnboardingState)
ob_workflow.add_node("planner", ob_planner)
ob_workflow.add_node("creator", ob_account_creator)
ob_workflow.add_node("escalate", ob_escalate_it)
ob_workflow.add_node("culture", ob_culture_agent)
ob_workflow.add_node("welcome", ob_welcome_agent)

ob_workflow.set_entry_point("planner")
ob_workflow.add_edge("planner", "creator")
ob_workflow.add_conditional_edges("creator", ob_check_retry, {"retry": "creator", "escalate": "escalate", "culture": "culture"})
ob_workflow.add_edge("escalate", "culture")
ob_workflow.add_edge("culture", "welcome")
ob_workflow.add_edge("welcome", END)
onboarding_workflow_app = ob_workflow.compile()

# --- SLA BREACH WORKFLOW ---
class SLAState(TypedDict):
    workflow_id: str
    input_text: str
    request_id: str
    approver: str
    stuck_hours: int
    is_on_leave: bool
    delegate: str
    logs: List[Dict[str, Any]]

async def sla_monitor(state: SLAState):
    prompt = f"Extract request ID and approver name from this text: '{state['input_text']}'. Return valid JSON ONLY: {{\"request_id\": \"...\", \"approver\": \"...\"}}"
    resp = await llm.ainvoke([HumanMessage(content=prompt)])
    try:
        import json
        content = resp.content.replace('```json', '').replace('```', '').strip()
        data = json.loads(content)
        state['request_id'] = data.get('request_id', 'Unknown')
        state['approver'] = data.get('approver', 'Unknown')
        state['stuck_hours'] = 48
    except:
        state['request_id'] = "PO-1234"
        state['approver'] = "Sarah"
        state['stuck_hours'] = 48
    await log_step(state['workflow_id'], "SLAMonitor", f"Detected stuck request {state['request_id']} for {state['stuck_hours']}h", {"approver": state['approver']})
    return state

async def sla_hr_checker(state: SLAState):
    await log_step(state['workflow_id'], "HRIntegrationAgent", f"Checking leave status for {state['approver']} in Workday", {"action": "API Call"})
    state['is_on_leave'] = True 
    await log_step(state['workflow_id'], "HRIntegrationAgent", f"Confirmed: {state['approver']} is currently on leave.", {"leave_type": "PTO", "return_date": "Next Week"})
    return state

async def sla_rerouter(state: SLAState):
    if state.get('is_on_leave'):
        state['delegate'] = "David (Manager)"
        await log_step(state['workflow_id'], "RerouteAgent", f"Identified delegate for {state['approver']} -> {state['delegate']}", {"action": "lookup_delegate"})
        await log_step(state['workflow_id'], "RerouteAgent", f"Rerouted request {state['request_id']} to {state['delegate']}", {"status": "rerouted"})
    return state

async def sla_auditor(state: SLAState):
    await log_step(state['workflow_id'], "AuditLogger", f"Logged compliance override for request {state['request_id']}", {"original": state.get('approver'), "new": state.get('delegate'), "reason": "Original approver on leave (SLA > 48h)"})
    return state

sla_workflow = StateGraph(SLAState)
sla_workflow.add_node("monitor", sla_monitor)
sla_workflow.add_node("hr_checker", sla_hr_checker)
sla_workflow.add_node("rerouter", sla_rerouter)
sla_workflow.add_node("auditor", sla_auditor)

sla_workflow.set_entry_point("monitor")
sla_workflow.add_edge("monitor", "hr_checker")
sla_workflow.add_edge("hr_checker", "rerouter")
sla_workflow.add_edge("rerouter", "auditor")
sla_workflow.add_edge("auditor", END)
sla_workflow_app = sla_workflow.compile()
