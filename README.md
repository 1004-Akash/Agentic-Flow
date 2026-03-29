# AgenticFlow – Autonomous Enterprise Workflow System

**Target Track:** Track 2 — Autonomous Enterprise Workflows (Flagship Track)

## 🚀 Elevator Pitch
**AgenticFlow** is an enterprise-grade, Multi-Agent AI operating system designed to take absolute ownership of complex, multi-step business processes. Rather than just wrapping an API or acting as a simple chatbot, AgenticFlow uses an intelligent LangGraph orchestration engine to automatically ingest organizational data (like live meeting transcripts or compliance triggers), dynamically plan workloads, catch and self-correct exceptions, and execute without human intervention—all while keeping an immutable audit trail of its autonomous decisions.

## 🏆 How We Mastered the Scenario Packs

### ✅ 1. Meeting to Action
**The Problem:** Turning a multi-player meeting into structured, assigned trackable reality.
**Our Solution:** The core engine ingests live Web Speech API transcriptions into our pipeline. The **PlannerAgent** natively extracts action items and assigns owners. *Crucially*, instead of guessing or hallucinating ambiguous tasks, it flags them with `needs_clarification = True` and pushes them to the **FixAgent**, which determines the least busy engineer via MongoDB aggregation and reassigns it to them. The final state is pushed down to the **ReportAgent**, which emails all participants an executive summary.

### ✅ 2. SLA Breach Prevention
**The Problem:** Approvals get stuck when stakeholders are out of office (PTO/Leave), missing external SLAs.
**Our Solution:** The system processes stagnant ticket data via the **SLAMonitor**. It passes the approver's identity to the **HRIntegrationAgent**, which mocks a Workday API check to verify their "Leave" status. Once confirmed, the **RerouteAgent** automatically identifies the appropriate management delegate and forces the ticket to them. Finally, the **AuditLogger** explicitly injects a compliance override record into the ledger: *"Original approver on leave (>48h SLA) – ticket conditionally rerouted to delegate."*

### ✅ 3. Employee Onboarding
**The Problem:** Stagnant onboarding provisioning that fails mid-way due to brittle 3rd party APIs.
**Our Solution:** The **OnboardingPlanner** detects a new hire (e.g., John Doe) and sequences a provisioning array `["Slack", "Email", "JIRA"]`. The **AccountCreatorAgent** loops through and provisions them. We explicitly engineered a mock JIRA failure; the agent detects the network failure, branches into an *autonomous retry loop*, and upon a second failure, reroutes to the **ITEscalationAgent** to log a ServiceNow ticket. Finally, the graph naturally converges on the **CultureAgent** to assign a buddy and send the welcome pack.

---

## 📊 Alignment with the Evaluation Rubric

| Dimension | Weight | How AgenticFlow Transcends the Criteria |
| :--- | :--- | :--- |
| **Autonomy Depth** | 30% | Our main pipeline executes **7 autonomous sequential steps** without human input. It handles deep branching logic natively via LangGraph conditional edges (e.g., dynamically looping back to retry failed API hooks or skipping the `FixAgent` if the data is clean). |
| **Multi-Agent Design** | 20% | Responsibilities are highly atomized. The **TrackerAgent** solely calculates numerical task progress vectors from transcripts, while the **FixAgent** is restricted entirely to error-recovery. They pass a shared immutable `AgentState` object up and down the LangGraph orchestrator. |
| **Technical Creativity** | 20% | We utilized **LangGraph** for stateful multi-agent execution rather than brittle chained calls. The architecture implies cost-efficiency by allowing smaller OSS models (like Llama-3 8b via OpenRouter) to handle simple `AuditLogger` tasks while delegating the heavy `Planner` extraction to larger GPT/Claude models. |
| **Enterprise Readiness** | 20% | The **AuditLogger** agent creates a rigorous compliance trail outlining the *rationale* behind every autonomous act. When a ticket is stalled for over 24 hours and the FixAgent cannot resolve it programmatically, the system gracefully degrades by firing an emergency alert to a human admin via the Resend API. |
| **Impact Quantification** | 10% | Our **ReportAgent** mathematically calculates the system's impact at the end of every run—compiling the `automation_rate` (tasks completed / human tasks saved) and the exact number of autonomous interventions made. |

---

## ⚙️ The 7-Agent Neural Architecture

Our main `Meeting to Action` pipeline flows sequentially through these specialized LangChain agents:

1. **PlannerAgent** - Ingests prompt/transcript, extracts data, identifies unassigned tasks.
2. **AssignmentAgent** - Maps tasks into the unstructured MongoDB project tracker.
3. **TrackerAgent** - Listens for fractional numerical process updates (e.g., "frontend is 50% done") and updates the DB vectors.
4. **AlertAgent** - Sweeps the database for delayed tasks or SLA risks.
5. **FixAgent** - Catches alerts or ambiguous tasks. Reallocates tasks based on workload.
6. **LoggerAgent** - The enterprise compliance monitor. Compiles an immutable trail of decisions.
7. **ReportAgent** - The communications handler. Formats the data and dispatches Resend API emails.

*(Additional encapsulated topologies exist for `/onboarding` and `/sla-breach` triggers)*

## 💻 Tech Stack
- **AI/LLM**: OpenRouter (Model Agnostic), LangChain, LangGraph core orchestrator.
- **Backend**: Python, FastAPI, MongoDB (Motor Async).
- **Frontend**: React.js, Vite, Framer Motion, Vanilla CSS (Glassmorphism Dashboard UI).
- **WebSockets / Audio**: Web Speech API for live transcription syncing cleanly to the server via WS.
- **Notifications**: Resend API.

## 🛠️ To Run Locally
1. Boot Backend: `cd backend` -> `python main.py`
2. Boot Frontend: `cd frontend` -> `npm run dev`
3. Launch the Matrix Dashboard at `http://localhost:5173`. Click **"Launch New Sync"** to enter the lobby and click the specific Hackathon demo endpoints!
