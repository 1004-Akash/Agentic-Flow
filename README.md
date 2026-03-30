<div align="center">

<img src="https://img.shields.io/badge/Track-Autonomous%20Enterprise%20Workflows-6366f1?style=for-the-badge&labelColor=0f0f1a" />
<img src="https://img.shields.io/badge/Stack-LangGraph%20%7C%20FastAPI%20%7C%20React-22d3ee?style=for-the-badge&labelColor=0f0f1a" />
<img src="https://img.shields.io/badge/Agents-7%20Neural%20Units-10b981?style=for-the-badge&labelColor=0f0f1a" />

<br /><br />

```
 █████╗  ██████╗ ███████╗███╗   ██╗████████╗██╗ ██████╗    ███████╗██╗      ██████╗ ██╗    ██╗
██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██║██╔════╝    ██╔════╝██║     ██╔═══██╗██║    ██║
███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ██║██║         █████╗  ██║     ██║   ██║██║ █╗ ██║
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ██║██║         ██╔══╝  ██║     ██║   ██║██║███╗██║
██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ██║╚██████╗    ██║     ███████╗╚██████╔╝╚███╔███╔╝
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝   ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝
```

### **Autonomous Enterprise Workflow OS — Powered by a 7-Agent Neural Squadron**

*Ingest. Plan. Execute. Self-Correct. Report. No humans required.*

</div>

---

## 🚀 What Is AgenticFlow?

**AgenticFlow** is an enterprise-grade, Multi-Agent AI operating system that takes **absolute ownership** of complex, multi-step business processes. Rather than wrapping a simple API or acting as a chatbot, AgenticFlow uses an intelligent **LangGraph orchestration engine** to:

- 📥 Automatically ingest organizational data (live transcripts, compliance triggers)
- 🧠 Dynamically plan and distribute workloads across specialized agents
- 🔁 Catch and **self-correct** exceptions autonomously via retry loops
- ✅ Execute end-to-end without human intervention
- 📋 Maintain an **immutable audit trail** of every autonomous decision

---

## 🖥️ Platform Screenshots

### Entry Point — Role Selection
> Secured by Neural Guard & Multisig Verification

![Admin & New Joinee Portal](Prototype_Photos/adminnewjoinee.png)

*Two entry vectors: **Admin** (fleet oversight, escalation handling) and **New Joinee** (automated onboarding experience orchestrated by the multi-agent hive mind).*

---

### Predictive Observatory — Main Dashboard
> Autonomous fleet health and tactical task orchestration

![Dashboard](Prototype_Photos/dashboard.png)

*Real-time workload allocation across all active engineers. SLA & Critical Oversight panel shows live delayed tickets, rerouted approvals, and compliance overrides.*

---

### Multi-Agent Squadron — Agent Telemetry
> Real-time health and logic breakdown for all 7 neural units

![7 Agents Panel](Prototype_Photos/7agents.png)

*Each agent card shows its current **Health Status**, **Current Load**, and a live log stream link. The full squadron: PlannerAgent → AssignmentAgent → TrackerAgent → AlertAgent → FixAgent → LoggerAgent → ReportAgent.*

---

### Meetings — Live Intelligence Loop
> Multi-user provenance with real-time speech-to-text synthesis

![Meeting Room](Prototype_Photos/Meeting.png)

*The meeting room streams live transcripts via the **Web Speech API** directly to the orchestration pipeline. Participants join a secure meeting node; the 7-agent squadron processes all spoken content in real time.*

---

### Alex & Kamal — Live Meeting Sync
> Two-browser demo: Agent receives transcript and maps tasks autonomously

![Alex Kamal Meeting](Prototype_Photos/alexkamal.png)

*Split-screen demo showing both participant POVs. Kamal reports "100 percent frontend complete" — the TrackerAgent picks up the numerical signal and updates the database state vector immediately.*

---

### Meeting-to-Action Pipeline — Task Progress
> Extracted tasks, owners, progress bars, SLA countdowns, and telemetry flags

![Progress Tracker](Prototype_Photos/progress.png)

*The AssignmentAgent maps every extracted task to an owner. TrackerAgent monitors fractional progress updates. AlertAgent flags SLA risks. All displayed in the live pipeline view.*

---

### Compliance Reports — Immutable Audit Ledger
> Every autonomous decision, stored as a verifiable proof of execution

![Compliance Reports](Prototype_Photos/Report.png)

*1,244 total reports. 0 pending audits. 100% system integrity. Every agent decision — from SLA reroutes to onboarding provisioning — is logged with rationale in the Neural Evidence Hub.*

---

### Welcome Email — Resend API Dispatch
> Automated onboarding notification sent the moment a new hire is provisioned

![Mail Sent](Prototype_Photos/mailsent.png)

*The ReportAgent triggers a Resend API email the instant the OnboardingPlanner completes provisioning. Includes the full employee profile, role, department, and joining date — zero manual input required.*

---

### New Joinee Portal — Employee Welcome Pack
> The autonomous onboarding experience, from the new hire's perspective

![Welcome Pack](Prototype_Photos/welcomepack.png)

*Upon completion of the onboarding pipeline, the new associate sees their fully provisioned profile, confirmed tool access, and is introduced to their **AI Onboarding Buddy** — a RAG-based Telegram bot for 24/7 company Q&A.*

---

## ⚙️ The 7-Agent Neural Architecture

```
TRANSCRIPT / TRIGGER INPUT
         │
         ▼
  ┌─────────────┐
  │ PlannerAgent│  ←── Ingests prompt/transcript, extracts tasks, flags ambiguities
  └──────┬──────┘
         │
         ▼
  ┌──────────────────┐
  │ AssignmentAgent  │  ←── Maps tasks to engineers via workload + skill vectors (MongoDB)
  └──────┬───────────┘
         │
         ▼
  ┌──────────────┐
  │ TrackerAgent │  ←── Detects numerical progress signals, updates DB state vectors
  └──────┬───────┘
         │
         ▼
  ┌────────────┐
  │ AlertAgent │  ←── Sweeps for stagnant tasks or SLA breach risk
  └──────┬─────┘
         │
         ▼
  ┌──────────┐      ┌────────────────────┐
  │ FixAgent │ ───► │ ITEscalationAgent  │  (on unresolvable failure)
  └──────┬───┘      └────────────────────┘
         │
         ▼
  ┌──────────────┐
  │ LoggerAgent  │  ←── Immutable compliance ledger. Every decision. Every rationale.
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ ReportAgent  │  ←── Formats + dispatches executive summaries via Resend API
  └──────────────┘
```

> Additional isolated topologies exist for `/onboarding` and `/sla-breach` triggers.

---

## 🏆 Scenario Coverage

### ✅ Meeting to Action
The core engine ingests live Web Speech API transcriptions. The **PlannerAgent** extracts action items and assigns owners. Ambiguous tasks are flagged with `needs_clarification = True` and routed to the **FixAgent**, which determines the least-loaded engineer via MongoDB aggregation and reassigns accordingly. The **ReportAgent** emails all participants an executive summary on completion.

### ✅ SLA Breach Prevention
Stagnant ticket data is processed by the **SLAMonitor**. The approver's identity passes to the **HRIntegrationAgent**, which checks Workday leave status. The **RerouteAgent** identifies the appropriate management delegate and forces the ticket to them. The **AuditLogger** injects a compliance override: *"Original approver on leave (>48h SLA) — ticket conditionally rerouted to delegate."*

### ✅ Employee Onboarding
The **OnboardingPlanner** detects a new hire and sequences provisioning across `["Slack", "Email", "JIRA"]`. On a JIRA failure, the system enters an **autonomous retry loop**; on second failure, escalates to **ITEscalationAgent** for a ServiceNow ticket. The pipeline then converges on **CultureAgent** to assign a buddy and dispatch the welcome pack.

---

## 📊 Evaluation Rubric Alignment

| Dimension | Weight | Implementation |
|:---|:---:|:---|
| **Autonomy Depth** | 30% | 7 sequential autonomous steps. LangGraph conditional edges handle deep branching — retry loops, skip logic, and fallback escalation. |
| **Multi-Agent Design** | 20% | Highly atomized responsibilities. TrackerAgent only handles numerical vectors. FixAgent only handles error-recovery. Shared immutable `AgentState` object across the graph. |
| **Technical Creativity** | 20% | LangGraph for stateful execution. Model-agnostic via OpenRouter — lightweight OSS models for audit tasks, larger models for planning and extraction. |
| **Enterprise Readiness** | 20% | AuditLogger creates a compliance trail with full decision rationale. Emergency admin alerts via Resend API when the system cannot resolve autonomously. |
| **Impact Quantification** | 10% | ReportAgent calculates `automation_rate` (tasks completed / human tasks saved) and total autonomous interventions per run. |

---

## 💻 Tech Stack

| Layer | Technology |
|:---|:---|
| **AI / Orchestration** | LangChain, LangGraph, OpenRouter (model-agnostic) |
| **Backend** | Python, FastAPI, MongoDB (Motor Async) |
| **Frontend** | React.js, Vite, Framer Motion, Glassmorphism CSS |
| **Real-time Audio** | Web Speech API → WebSocket sync |
| **Notifications** | Resend API |

---

## 🛠️ Running Locally

```bash
# 1. Start the backend
cd backend
python main.py

# 2. Start the frontend
cd frontend
npm run dev

# 3. Open the Matrix Dashboard
open http://localhost:5173
```

Click **"Launch New Sync"** to enter the lobby, then hit the scenario endpoints:
- `Run Onboarding` — triggers the full employee onboarding pipeline
- `Run SLA Breach` — triggers the SLA rerouting and compliance override flow

---

<div align="center">

**Built for Track 2 — Autonomous Enterprise Workflows**

*AgenticFlow doesn't assist with work. It does the work.*

</div>
