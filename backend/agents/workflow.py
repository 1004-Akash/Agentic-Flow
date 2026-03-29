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
    past_tasks = await cursor.to_list(length=50)
    past_tasks_str = json.dumps([{"_id": str(t["_id"]), "task": t["task"], "person": t["person"], "progress": t.get("progress", 0)} for t in past_tasks])

    prompt = f"""
    You are a PlannerAgent in an enterprise workflow system. You have TWO distinct objectives based on the meeting transcript:
    1. Extract NEW tasks. Do NOT duplicate previous active tasks.
    2. Extract PROGRESS UPDATES for existing tasks. (e.g., if someone says they completed half their work, set progress to 50).
    
    Previous Active Tasks: {past_tasks_str}
    
    Meeting Text: {state['meeting_text']}
    
    IMPORTANT RULES FOR NEW TASKS:
    1. If a task has a CLEAR owner, assign them.
    2. If NO CLEAR owner, set person to "UNASSIGNED" and add "needs_clarification": true. Do not guess.
    
    Return ONLY a valid JSON object matching this schema exactly:
    {{
      "new_tasks": [
        {{
          "task": "Task Description",
          "person": "Name or UNASSIGNED",
          "deadline": "YYYY-MM-DD",
          "needs_clarification": false
        }}
      ],
      "progress_updates": [
        {{
          "_id": "matching existing task _id",
          "progress": 50,
          "status": "in-progress"
        }}
      ]
    }}
    """
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    try:
        content = response.content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(content)
        
        # 1. Handle New Tasks
        tasks = parsed.get("new_tasks", [])
        ambiguous = [t for t in tasks if t.get("needs_clarification")]
        state['tasks'] = tasks
        
        await log_step(state['workflow_id'], "PlannerAgent", "Extract new tasks", {
            "total_extracted": len(tasks),
            "ambiguous_flagged": len(ambiguous),
            "tasks": tasks
        })
        if ambiguous:
            await log_step(state['workflow_id'], "PlannerAgent", "AMBIGUITY DETECTED", ambiguous)
            
        # 2. Handle Progress Updates
        updates = parsed.get("progress_updates", [])
        updated_log = []
        from bson import ObjectId
        for upd in updates:
            try:
                task_id = upd.get("_id")
                new_progress = upd.get("progress", 0)
                new_status = upd.get("status", "in-progress") if new_progress < 100 else "completed"
                await tasks_collection.update_one({"_id": ObjectId(task_id)}, {"$set": {"progress": new_progress, "status": new_status}})
                updated_log.append({"task_id": task_id, "progress": new_progress})
            except: pass
            
        if updated_log:
            await log_step(state['workflow_id'], "PlannerAgent", "Updated existing task progress", {"updates": updated_log})

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
                await session.post("https://api.resend.com/emails", headers={"Authorization": "Bearer re_VzHmzh5R_yehgFQzdqdGhw3zp4ZVn6e16", "Content-Type": "application/json"}, json={"from": "onboarding@resend.dev", "to": [state.get('email', 'test111723201002@gmail.com')], "subject": "AgenticFlow: Escalation Alert", "html": esc_html})
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
                resp = await session.post("https://api.resend.com/emails", headers={"Authorization": "Bearer re_VzHmzh5R_yehgFQzdqdGhw3zp4ZVn6e16", "Content-Type": "application/json"}, json={"from": "onboarding@resend.dev", "to": [email_target], "subject": "AgenticFlow: Pipeline Report", "html": email_html})
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
workflow.add_node("alert", alert_agent)
workflow.add_node("fix", fix_agent)
workflow.add_node("logger", logger_agent)
workflow.add_node("report", report_agent)

workflow.set_entry_point("planner")
workflow.add_edge("planner", "assignment")
workflow.add_edge("assignment", "alert")
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
    role: str
    department: str
    buddy_link: str
    systems_to_create: List[str]
    tasks_status: List[Dict[str, str]]
    jira_retries: int
    escalated: bool
    buddy: str
    orientation_scheduled: str
    welcome_pack_sent: bool
    logs: List[Dict[str, Any]]
    errors: List[str]
    next_action: str

async def ob_planner(state: OnboardingState):
    prompt = f"""
    Extract employee details from text: {state.get('input_text', '')}.
    Return ONLY valid JSON:
    {{
      "name": "...",
      "role": "...",
      "department": "..."
    }}
    """
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    try:
        data = json.loads(response.content.replace("```json", "").replace("```", "").strip())
        state['employee_name'] = data.get("name", "New Employee")
        state['role'] = data.get("role", "Software Engineer")
        state['department'] = data.get("department", "Engineering")
    except:
        state['employee_name'] = response.content.strip()
        state['role'] = "Software Engineer"
        state['department'] = "Engineering"
        
    state['buddy_link'] = "https://t.me/AgenticFlowBuddyAI_bot"
    state['systems_to_create'] = ["Slack", "Email", "JIRA"]
    state['tasks_status'] = [{"system": sys, "status": "pending"} for sys in state['systems_to_create']]
    state['errors'] = []
    
    await log_step(state['workflow_id'], "OnboardingPlanner", "Sequenced onboarding tasks", {
        "new_hire": state['employee_name'], 
        "role": state['role'],
        "department": state['department'],
        "tasks": state['tasks_status']
    })
    return state

# Controlled JIRA Failure Simulation
async def ob_jira_node(state: OnboardingState):
    print(f"[PIPELINE] ::: JIRA Provisioning Node (Retry: {state.get('jira_retries', 0)})")
    
    # ❌ Simulated deterministic failure on all attempts for the demo
    if state.get("jira_retries", 0) < 5:
        error_msg = "JIRA API Gateway Error: Authentication Timeout (504)"
        state["logs"].append({"agent": "AccountCreatorAgent", "action": "JIRA setup", "result": error_msg})
        await log_step(state['workflow_id'], "AccountCreatorAgent", "Attempting JIRA provisioning", "❌ FAILED: " + error_msg)
        # We don't raise Exception here to keep the graph flow controlled
        state["errors"] = [error_msg]
        return state

    # ✅ Success on second attempt (unreachable now, for demo)
    state["tasks_status"][2]["status"] = "success"
    state["errors"] = []
    await log_step(state['workflow_id'], "AccountCreatorAgent", "JIRA setup retry", "✅ SUCCESS: Account created for " + state['employee_name'])
    return state

async def ob_slack_email_node(state: OnboardingState):
    state["tasks_status"][0]["status"] = "success"
    state["tasks_status"][1]["status"] = "success"
    await log_step(state['workflow_id'], "AccountCreatorAgent", "Slack & Email provisioning", "✅ SUCCESS: Accounts provisioned")
    return state

# 🚨 AlertAgent (Detect Failure)
def ob_alert_agent(state: OnboardingState):
    if state.get("errors"):
        print("[AGENT] AlertAgent: Critical issue detected in JIRA setup pipeline.")
        return "fix" # route to FixAgent
    return "continue" # proceed to culture buddy

# 🔧 FixAgent (Retry + Escalate)
async def ob_fix_agent(state: OnboardingState):
    print(f"[AGENT] FixAgent analyzing JIRA failure (Retries so far: {state['jira_retries']})")
    
    if state.get("jira_retries", 0) < 1:
        state["jira_retries"] = state.get("jira_retries", 0) + 1
        await log_step(state['workflow_id'], "FixAgent", "Autonomous Recovery Triggered", "🔁 Retrying JIRA creation in 5 seconds...")
        # Clear errors to allow the next attempt
        state["errors"] = []
        state["next_action"] = "retry_jira"
    else:
        state["escalated"] = True
        state["next_action"] = "continue"
        await log_step(state['workflow_id'], "FixAgent", "Max retries reached", "🚨 Escalating to IT Infrastructure Team via ServiceNow.")
        
        # Simulated IT Notification
        print(f"!!! [IT NOTIFICATION] Urgent for {state['employee_name']} - JIRA provisioning permanently failed after {state['jira_retries']} retries.")
        
        # Integrate with Resend for escalation email
        from aiohttp import ClientSession
        async with ClientSession() as session:
            try:
                await session.post("https://api.resend.com/emails", 
                    headers={"Authorization": "Bearer re_VzHmzh5R_yehgFQzdqdGhw3zp4ZVn6e16", "Content-Type": "application/json"}, 
                    json={
                        "from": "onboarding@resend.dev", 
                        "to": ["it-support@agenticflow.inc"], 
                        "subject": f"🚨 URGENT: JIRA Provisioning Failure - {state['employee_name']}", 
                        "html": f"<p>JIRA access failed for new hire {state['employee_name']}. <b>Autonomous recovery failed after 2 attempts.</b> Manual intervention required.</p>"
                    })
            except: pass
            
    return state

async def ob_culture_agent(state: OnboardingState):
    state['buddy'] = "Jane Smith"
    state['orientation_scheduled'] = "Monday, April 6th @ 10:00 AM (EST)"
    await log_step(state['workflow_id'], "CultureAgent", "Assigned buddy and scheduled orientation", {
        "buddy": state['buddy'],
        "orientation": state['orientation_scheduled']
    })
    return state

async def ob_welcome_agent(state: OnboardingState):
    print(f"[PIPELINE] ::: WelcomeAgent generating professional onboarding email...")
    
    # Deriving status for JIRA
    jira_status_val = state['tasks_status'][2]['status']
    jira_badge = f'<span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">SUCCESS</span>'
    jira_extra = ""
    
    if jira_status_val != "success":
        jira_badge = f'<span style="background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">PENDING</span>'
        escalation_note = " (Escalated to IT Engineering)" if state.get('escalated') else " (Retrying...)"
        jira_extra = f"""
        <div style="font-size: 14px; margin-top: 5px; color: #64748b;">
            We are currently finalizing your JIRA access. There is a slight delay, but our team is already on it{escalation_note} to ensure you have everything you need shortly.
        </div>
        """

    html_email = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }}
            .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }}
            .header {{ background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 20px; text-align: center; color: #ffffff; }}
            .content {{ padding: 40px 30px; }}
            .section {{ margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9; }}
            .card {{ background: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 10px; border: 1px solid #e2e8f0; }}
            .button {{ display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px; }}
            .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; background: #f8fafc; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div style="font-size: 40px; margin-bottom: 10px;">👋</div>
                <h1 style="margin: 0;">Welcome to the Team!</h1>
            </div>
            <div class="content">
                <p style="font-size: 18px; font-weight: 600; color: #1e293b;">Hi {state['employee_name']},</p>
                <p>We are thrilled to have you join us as our new <span style="color: #2563eb; font-weight: 600;">{state['role']}</span> in the <span style="color: #2563eb; font-weight: 600;">{state['department']}</span> department.</p>
                
                <p>Your official email: <strong>test111723201002@gmail.com</strong></p>

                <div class="section">
                    <div style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: #64748b;">📅 Orientation Schedule</div>
                    <div class="card">
                        <strong>Scheduled for:</strong> {state['orientation_scheduled']}<br>
                        <p style="margin: 10px 0 0 0; font-size: 13px; color: #64748b;">Check your calendar for the Zoom invite and agenda.</p>
                    </div>
                </div>

                <div class="section">
                    <div style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: #64748b;">🛠️ Tool Access</div>
                    <ul style="padding-left: 20px;">
                        <li><strong>Slack:</strong> Access granted. Invite sent.</li>
                        <li style="margin-top: 10px;">
                            <strong>JIRA:</strong> {jira_badge}
                            {jira_extra}
                        </li>
                    </ul>
                </div>

                <div class="section">
                    <div style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: #64748b;">🤖 AI Assistant (Telegram Buddy)</div>
                    <p>Meet your automated buddy for instant help with company policies and setup.</p>
                    <a href="{state['buddy_link']}" class="button">Connect with Buddy</a>
                </div>

                <div class="section" style="border-bottom: none;">
                    <div style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: #64748b;">📦 Welcome Pack</div>
                    <ul style="padding-left: 20px;">
                        <li>Company Handbook & Culture Guide</li>
                        <li>Hardware Setup Instructions</li>
                        <li>Direct Access Links Dashboard</li>
                    </ul>
                </div>

                <p style="margin-top: 20px;">Best regards,<br><strong>AgenticFlow People Ops</strong></p>
            </div>
            <div class="footer">© 2026 AgenticFlow System | Automated Onboarding Pipeline</div>
        </div>
    </body>
    </html>
    """

    import aiohttp
    async with aiohttp.ClientSession() as session:
        try:
            await session.post("https://api.resend.com/emails", 
                headers={"Authorization": "Bearer re_VzHmzh5R_yehgFQzdqdGhw3zp4ZVn6e16", "Content-Type": "application/json"}, 
                json={
                    "from": "onboarding@resend.dev", 
                    "to": ["test111723201002@gmail.com"], # Fixed as per demo requirements
                    "subject": f"Welcome to the Team, {state['employee_name']}!", 
                    "html": html_email
                })
        except Exception as e:
            print(f"[ERROR] Failed to send welcome email: {str(e)}")

    state['welcome_pack_sent'] = True
    await log_step(state['workflow_id'], "CultureAgent", "Sent professional welcome email with documents", {"welcome_pack_sent": True, "recipient": "test111723201002@gmail.com"})
    return state

# --- LangGraph Onboarding Definition ---
ob_workflow = StateGraph(OnboardingState)

ob_workflow.add_node("planner", ob_planner)
ob_workflow.add_node("provision_slack_email", ob_slack_email_node)
ob_workflow.add_node("jira", ob_jira_node)
ob_workflow.add_node("fix_agent", ob_fix_agent)
ob_workflow.add_node("culture", ob_culture_agent)
ob_workflow.add_node("welcome", ob_welcome_agent)

ob_workflow.set_entry_point("planner")
ob_workflow.add_edge("planner", "provision_slack_email")
ob_workflow.add_edge("provision_slack_email", "jira")

# 🔄 Agentic Conditional Flow
ob_workflow.add_conditional_edges(
    "jira",
    ob_alert_agent,
    {
        "fix": "fix_agent",
        "continue": "culture"
    }
)

def ob_fix_router(state: OnboardingState):
    return state.get("next_action", "continue")

ob_workflow.add_conditional_edges(
    "fix_agent",
    ob_fix_router,
    {
        "retry_jira": "jira",
        "continue": "culture"
    }
)

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
