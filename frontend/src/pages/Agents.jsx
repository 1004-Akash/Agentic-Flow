import React from 'react';
import { 
  Users, Activity, Shield, Zap, AlertTriangle, Wrench, Terminal, FileSearch, CheckCircle2
} from 'lucide-react';

const Agents = () => {
  const agentsList = [
    { 
      name: "PlannerAgent", 
      role: "Strategic Orchestrator", 
      icon: Users, 
      color: "indigo", 
      desc: "Ingests raw data/transcripts and sequences the autonomous execution chain.",
      health: "98%",
      load: "Low"
    },
    { 
      name: "AssignmentAgent", 
      role: "Resource Allocator", 
      icon: Zap, 
      color: "blue", 
      desc: "Maps tasks to engineering owners based on workload and skill vectors.",
      health: "100%",
      load: "Idle"
    },
    { 
      name: "TrackerAgent", 
      role: "Numerical Monitor", 
      icon: Activity, 
      color: "purple", 
      desc: "Calculates process progression and updates database state vectors.",
      health: "96%",
      load: "Moderate"
    },
    { 
      name: "AlertAgent", 
      role: "SLA Sentinel", 
      icon: AlertTriangle, 
      color: "rose", 
      desc: "Proactively identifies stagnant tasks or potential compliance breaches.",
      health: "92%",
      load: "Nominal"
    },
    { 
      name: "FixAgent", 
      role: "Error Remediation", 
      icon: Wrench, 
      color: "amber", 
      desc: "Self-corrects ambiguous assignments or executes autonomous retries.",
      health: "100%",
      load: "Standby"
    },
    { 
      name: "LoggerAgent", 
      role: "Compliance Historian", 
      icon: Terminal, 
      color: "emerald", 
      desc: "Streams every decision to an immutable ledger for enterprise auditability.",
      health: "100%",
      load: "High"
    },
    { 
      name: "ReportAgent", 
      role: "Dispatch Handler", 
      icon: FileSearch, 
      color: "cyan", 
      desc: "Compiles final executive summaries and dispatches multi-channel alerts.",
      health: "100%",
      load: "Idle"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scroll">
      <div className="mb-10 mt-6">
          <h2 className="text-[32px] font-bold text-white tracking-tight">Multi-Agent <span className="text-indigo-400">Squadron</span></h2>
          <p className="text-[14px] text-slate-400 mt-1 font-medium">Real-time telemetry and logic breakdown for the 7-agent neural ensemble.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {agentsList.map((agent, i) => (
            <div key={i} className="bg-[#1A2235] border border-[#2D3748] rounded-2xl p-6 hover:border-indigo-500/50 transition-all group">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 bg-${agent.color}-500/10 rounded-xl group-hover:scale-110 transition-transform`}>
                            <agent.icon className={`w-6 h-6 text-${agent.color}-400`} />
                        </div>
                        <div>
                            <h3 className="text-[17px] font-bold text-white leading-tight">{agent.name}</h3>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">{agent.role}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#052e16] px-3 py-1 rounded-full border border-[#065f46]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">Synced</span>
                    </div>
                </div>

                <p className="text-[13px] text-slate-400 leading-relaxed mb-8">
                    {agent.desc}
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#151B2B] rounded-xl p-3 border border-[#2D3748]/50">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Health Status</p>
                        <p className="text-[15px] font-black text-white">{agent.health}</p>
                    </div>
                    <div className="bg-[#151B2B] rounded-xl p-3 border border-[#2D3748]/50">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Load</p>
                        <p className={`text-[15px] font-black ${agent.load === 'High' ? 'text-rose-400' : 'text-indigo-400'}`}>{agent.load}</p>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#2D3748] flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Neural Link v4.2</span>
                    <button className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">View Log Stream →</button>
                </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Agents;
