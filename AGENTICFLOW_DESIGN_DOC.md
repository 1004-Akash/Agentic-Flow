# AgenticFlow — Autonomous Enterprise intelligence

## 1. Executive Summary
AgenticFlow is an advanced, AI-powered multi-agent system designed to completely automate, orchestrate, and self-heal complex enterprise workflows. Unlike traditional RPA (Robotic Process Automation) scripts that break when APIs fail, AgenticFlow uses a deterministic graph-based orchestration engine (LangGraph) combined with large language models to make autonomous decisions, handle API timeouts gracefully, and maintain a cryptographically immutable audit trail.

**Use Cases Demonstrated:**
- **Zero-Touch Employee Onboarding:** Autonomous provisioning of Slack, Email, and JIRA accounts, paired with automatic IT escalation when vendor APIs fail.
- **Meeting-to-Action Pipeline:** WebSocket-driven live collaborative meetings where an AI parses transcripts, synthesizes tasks, identifies the owner, and automatically tracks progress across multiple meetings.

---

## 2. Core Technology Stack
- **Frontend Layer:** React.js, TailwindCSS, Framer Motion (for dynamic, high-fidelity UI tracking).
- **Backend Orchestration:** FastAPI (Python), LangGraph (Stateful Multi-Agent Routing), Websockets (Real-time WebRTC/Speech tracking).
- **Database / Provenance:** MongoDB (NoSQL document storage for users, transcripts, active tasks, and audit logs).
- **LLM Engine:** Llama-3 (8B) / GPT-4 via **OpenRouter**, capable of processing complex JSON schemas and extracting workflow states.
- **Integrations:** Resend API (Transactional HTML emails), Telegram API (RAG-based AI Buddy), FAISS (Vector Embeddings).

---

## 3. The 7-Agent Neural Pipeline
At the core of AgenticFlow is a LangGraph state machine. Each "Agent" is a specialized node responsible for a distinct part of the enterprise lifecycle.

1. **PlannerAgent (Strategy Layer):** Parses raw meeting transcripts or HR requests. Uses OpenRouter to extract JSON arrays of new tasks and cross-reference them with existing tasks for dynamic progress tracking (e.g., updating a task to 50% complete without human intervention).
2. **AssignmentAgent (Resource Allocator):** Ensures tasks have valid owners.
3. **TrackerAgent (Provenance Monitor):** Maps historical data against incoming signals.
4. **AlertAgent (Threat Detection):** Continuously monitors the graph state. If an external API (like JIRA) throws a 504 Timeout, the AlertAgent catches the exception and actively routes the graph away from a system crash.
5. **FixAgent (Auto-Remediation):** Handles conditional branching. If the AlertAgent flags a failure, the FixAgent triggers an autonomous retry loop. If max retries are hit, it permanently skips the node and natively emails the IT department via ServiceNow/Resend to escalate the failure.
6. **LoggerAgent (Audit Streamer):** Writes every single agentic decision securely to MongoDB. Provides the immutable ledger seen in the "Reports" tab.
7. **CultureAgent (Welcome Orchestrator):** Triggers the final Resend API call to deploy the employee's onboarding email, including dynamic UI badges indicating which portions of their provisioning failed and require IT intervention.

---

## 4. Workflows & Hackathon Demo Paths

### A. Autonomous Escalation Loop (The JIRA Timeout)
1. **Trigger:** Human enters new employee details in the New Joinee Portal.
2. **Execution:** LangGraph attempts to provision Slack, Email, and JIRA.
3. **Failure:** JIRA purposefully throws a timeout error.
4. **Recovery:** The `AlertAgent` spots the error. The `FixAgent` increments a retry counter and retries JIRA.
5. **Escalation:** After 2 failed retries, the FixAgent flags the task as "escalated," skips the JIRA node, alerts `it-support@agenticflow.inc`, and allows the rest of the onboarding to succeed. The employee receives a welcome email noting the temporary JIRA delay.

### B. Meeting Intelligence & Real-Time Sync
1. **Trigger:** Users connect via the `/meeting/:id` dynamic link using WebSockets.
2. **Telemetry:** The Web Speech API pushes live transcription segmented by user names directly to the FastAPI connection manager.
3. **Synthesis:** Upon clicking "Finalize & Synthesize," the `PlannerAgent` reviews the full transcript, isolates action items, matches them to specific team members (Kamal, Surjith, etc.), and updates the MongoDB tasks collection.
4. **Dashboard:** The React UI renders the new task dynamically, assigning SLA countdowns and updating the percentage completion based strictly on conversational context.

---

## 5. System Environments & Setup

**Prerequisites:**
- Python 3.10+
- Node.js & npm
- MongoDB URI
- Resend API Key
- OpenRouter API Key
- Telegram Bot Token

**Backend Setup:**
```bash
cd backend
pip install -r requirements.txt
# Update .env with keys: MONGODB_URI, OPENROUTER_API_KEY, RESEND_API_KEY, TELEGRAM_BOT_TOKEN
uvicorn main:app --reload
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

*Note: The FastAPI instance runs on port `8000` and the React frontend maps to it via explicit `http://localhost:8000` requests.*
