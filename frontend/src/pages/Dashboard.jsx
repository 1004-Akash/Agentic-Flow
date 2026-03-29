import React from 'react';
import { 
  Calendar, Users, Zap, AlertTriangle, Wrench, Terminal, Clock, CornerUpRight, ShieldCheck, Database
} from 'lucide-react';

const Dashboard = ({ tasks, logs, updateStatus }) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scroll px-8 pb-12">
        {/* HEADER */}
        <div className="mb-8 mt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
                <h2 className="text-[32px] font-bold text-white tracking-tight flex items-baseline gap-1.5">Predictive <span className="text-indigo-200 font-medium">Observatory</span></h2>
                <p className="text-[14px] text-slate-400 mt-1 font-medium">Autonomous fleet health and tactical task orchestration.</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 bg-[#052e16] px-4 py-2 rounded-lg border border-[#065f46]">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span className="text-[10px] font-bold text-emerald-400">System Nominal</span>
               </div>
               <div className="flex items-center gap-2 bg-[#1A2235] px-4 py-2 rounded-lg border border-[#2D3748]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400">Last Sync: 12s ago</span>
               </div>
            </div>
        </div>

        {/* MAIN GRID */}
        <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Agent Cards */}
                <AgentCard icon={Calendar} name="PlannerAgent" role="Strategy Layer" status="Active" progress={82} color="indigo" />
                <AgentCard icon={Users} name="AssignmentAgent" role="Resource Allocator" status="Active" progress={45} color="blue" />
                <AgentCard icon={Zap} name="TrackerAgent" role="Provenance Monitor" status="Active" progress={98} color="purple" />
                <AgentCard icon={AlertTriangle} name="AlertAgent" role="Threat Detection" status="Critical" progress={12} color="rose" bgGradient="from-[#3b0a1a] to-[#1A2235]" borderColor="border-rose-900/40" />
                <AgentCard icon={Wrench} name="FixAgent" role="Auto-Remediation" status="Idle" progress={0} color="slate" />
                <AgentCard icon={Terminal} name="LoggerAgent" role="Audit Streamer" status="Active" progress={67} color="emerald" />
            </div>

            {/* Right Column Stats */}
            <div className="w-full xl:w-[300px] flex flex-col gap-6">
                <div className="bg-[#1A2235] rounded-2xl p-6 flex flex-col">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-[#2D3748] pb-4">SLA & Critical Oversight</h4>
                    <div className="space-y-4 flex-1">
                        <StatItem icon={Clock} label="Delayed Tickets" value="18" color="rose" />
                        <StatItem icon={CornerUpRight} label="Rerouted Approvals" value="04" color="amber" />
                        <StatItem icon={ShieldCheck} label="Compliance Overrides" value="12" color="indigo" />
                    </div>
                    <button className="w-full mt-6 py-3.5 text-[11px] font-bold text-slate-300 hover:text-white bg-[#151B2B] hover:bg-[#252E46] rounded-xl transition-colors">Generate Compliance Audit</button>
                </div>

                <div className="bg-[#1A2235] rounded-2xl p-6">
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">System Load</h4>
                     <div className="h-20 flex items-end gap-[4px] px-1">
                         {[30, 45, 30, 70, 90, 60, 45, 80, 50, 40].map((h, i) => (
                             <div key={i} className="flex-1 bg-[#2D3748] rounded-sm relative group">
                                 <div className="absolute bottom-0 w-full bg-slate-500 rounded-sm" style={{height: `${h}%`}}></div>
                             </div>
                         ))}
                     </div>
                     <p className="text-[10px] text-slate-500 font-medium leading-[1.4] mt-4">Real-time GPU/Token utilization across global clusters.</p>
                </div>
            </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-6 flex flex-col xl:flex-row gap-6">
            <div className="flex-1 bg-[#1A2235] rounded-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-[#2D3748] flex justify-between items-center bg-[#1E273A]">
                    <h3 className="text-[17px] font-bold text-white">Meeting-to-Action Pipeline</h3>
                    <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/20">Engineering Sync (09:45 AM)</span>
                </div>
                <div className="flex-1 overflow-x-auto p-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#2D3748]">
                                <th className="px-4 py-4">Task Detail</th>
                                <th className="px-4 py-4">Primary Owner</th>
                                <th className="px-4 py-4">SLA Countdown</th>
                                <th className="px-4 py-4">Telemetry Flags</th>
                                <th className="px-4 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2D3748]">
                            {tasks.length > 0 ? tasks.map(t => (
                                <tr key={t._id} className="hover:bg-[#1E273A] transition-colors group">
                                    <td className="px-4 py-5">
                                        <p className="font-bold text-[14px] text-slate-200">{t.task}</p>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex items-center gap-3">
                                           <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold">{t.person.substring(0,2).toUpperCase()}</div>
                                           <span className="text-[13px] font-semibold text-slate-300">{t.person}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex items-center gap-2 text-rose-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[13px] font-bold font-mono">02:14:55</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        {(t.needs_clarification || t.person === 'UNASSIGNED') ? (
                                            <span className="bg-[#2d2215] text-amber-500 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded">NEEDS_CLARIFICATION</span>
                                        ) : (
                                            <span className="bg-[#052e16] text-emerald-500 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded">NOMINAL</span>
                                        )}
                                    </td>
                                     <td className="px-4 py-5 text-right">
                                         <button 
                                             onClick={() => updateStatus(t._id, { status: "completed", progress: 100 })}
                                             className="opacity-0 group-hover:opacity-100 p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all"
                                             title="Mark as Completed"
                                         >
                                             <ShieldCheck className="w-4 h-4" />
                                         </button>
                                     </td>
                                </tr>
                            )) : (
                                <tr className="hover:bg-[#1E273A] transition-colors group">
                                    <td colSpan="5" className="px-4 py-20 text-center text-slate-500">
                                        No active synthesis in progress.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-[#2D3748] bg-[#1E273A]/30">
                     <button 
                        onClick={() => window.location.href='/tasks'}
                        className="w-full py-3 text-[11px] font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"
                     >
                        <span>View All Tactical Vectors</span>
                        <CornerUpRight className="w-3.5 h-3.5" />
                     </button>
                </div>
            </div>

            {/* Audit Stream Tracker */}
            <div className="w-full xl:w-[360px] bg-[#1A2235] rounded-2xl flex flex-col h-[420px]">
                <div className="p-6 border-b border-[#2D3748] flex justify-between items-center bg-[#1E273A] rounded-t-2xl z-10 shrink-0">
                    <div>
                       <h3 className="text-[17px] font-bold text-white leading-tight">Audit Trail Stream</h3>
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live Immutable Ledger</p>
                    </div>
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                        <Database className="w-5 h-5 text-white" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-7 custom-scroll">
                    {logs.map((log, i) => (
                      <div key={i} className="relative pl-6 pb-2 border-l border-[#2D3748] last:border-transparent">
                          <div className={`absolute left-[-4.5px] top-1 w-2 h-2 rounded-full ring-4 ring-[#1A2235] ${log.type === 'error' ? 'bg-rose-500' : 'bg-slate-500'}`}></div>
                          <p className="text-[10px] font-mono text-slate-500 mb-1.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                          <p className="text-[13px] font-medium text-slate-300 leading-snug break-words">
                             <span className="font-bold text-white">{log.agent}</span> {log.action}
                          </p>
                      </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="text-center py-10 text-slate-500 text-[13px]">No audit logs available.</div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

const AgentCard = ({ icon: Icon, name, role, status, progress, color, bgGradient, borderColor }) => (
    <div className={`${bgGradient || 'bg-[#1A2235]'} rounded-2xl p-6 transition-colors relative flex flex-col justify-between min-h-[280px] border ${borderColor || 'border-transparent'}`}>
        <div className="flex justify-between items-start">
           <div className="flex items-center gap-3">
              <div className={`p-2.5 bg-[#252E46] rounded-xl`}><Icon className={`w-5 h-5 text-${color}-400`} /></div>
              <div>
                 <h3 className="text-[15px] font-bold text-white">{name}</h3>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{role}</p>
              </div>
           </div>
           <span className={`${status === 'Critical' ? 'bg-rose-900/60 text-rose-400' : 'bg-[#064e3b] text-emerald-400'} text-[10px] font-bold px-2.5 py-1 rounded border ${status === 'Critical' ? 'border-rose-800' : 'border-[#065f46]'}`}>{status}</span>
        </div>
        <div className="space-y-4">
            <div className="flex justify-between text-[13px] text-slate-300"><span>Performance</span><span className="font-bold text-white">{progress}%</span></div>
            <div className="w-full bg-[#252E46] h-1.5 rounded-full overflow-hidden">
               <div className={`bg-${color}-500 h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]`} style={{ width: `${progress}%` }}></div>
            </div>
            <div className="pt-2 flex justify-between items-center">
               <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Telemetry Link Established</span>
            </div>
        </div>
    </div>
);

const StatItem = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center justify-between p-4 bg-[#151B2B] rounded-xl">
        <div className="flex items-center gap-3">
           <div className={`p-2 bg-${color}-500/10 rounded-lg`}><Icon className={`w-4 h-4 text-${color}-400`} /></div>
           <span className="text-[13px] font-bold text-slate-300 leading-tight">{label}</span>
        </div>
        <span className={`text-2xl font-black text-${color}-400`}>{value}</span>
    </div>
);

export default Dashboard;
