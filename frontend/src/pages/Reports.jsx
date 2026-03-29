import React from 'react';
import { 
  FileText, Download, Share2, Search, Filter, Database, CalendarRange, CheckCircle
} from 'lucide-react';

const Reports = () => {
  const reportsList = [
      { id: "REP-9921", name: "Autonomous SLA Audit", type: "System Audit", date: "2026-03-28", status: "Critical Path", size: "1.2MB" },
      { id: "REP-9920", name: "Onboarding Flow Synthesis", type: "Workflow Log", date: "2026-03-27", status: "Nominal", size: "450KB" },
      { id: "REP-9919", name: "Meeting Intelligence Summary", type: "Task Analysis", date: "2026-03-27", status: "Nominal", size: "890KB" },
      { id: "REP-9918", name: "Security Compliance Review", type: "Audit", date: "2026-03-26", status: "Success", size: "2.1MB" },
      { id: "REP-9917", name: "Predictive Load Balancer", type: "Telemetry", date: "2026-03-26", status: "Optimized", size: "128KB" }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scroll flex flex-col">
       <div className="mb-10 mt-6 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
          <div>
              <h2 className="text-[32px] font-bold text-white tracking-tight">Compliance <span className="text-indigo-400">Reports</span></h2>
              <p className="text-[14px] text-slate-400 mt-1 font-medium">Immutable documentation of autonomous fleet decisions.</p>
          </div>
          <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[13px] rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  <Database className="w-4 h-4" />
                  <span>Generate New Audit</span>
              </button>
          </div>
       </div>

       <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
           <ReportStatCard label="Total Reports" value="1,244" icon={FileText} color="indigo" />
           <ReportStatCard label="Pending Audits" value="0" icon={CalendarRange} color="emerald" />
           <ReportStatCard label="System Integrity" value="100%" icon={CheckCircle} color="blue" />
       </div>

       <div className="bg-[#1A2235] border border-[#2D3748] rounded-2xl overflow-hidden flex flex-col shrink-0">
           <div className="p-6 border-b border-[#2D3748] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E273A]">
               <div className="relative flex-1 max-w-md">
                   <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                   <input type="text" placeholder="Search report ledger..." className="w-full bg-[#151B2B] border border-[#2D3748] rounded-lg px-11 py-2.5 text-[13px] text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors" />
               </div>
               <div className="flex items-center gap-3">
                   <button className="p-2.5 hover:bg-[#2D3748] rounded-lg text-slate-500 hover:text-white transition-all border border-[#2D3748]">
                       <Filter className="w-4 h-4" />
                   </button>
                   <button className="p-2.5 hover:bg-[#2D3748] rounded-lg text-slate-500 hover:text-white transition-all border border-[#2D3748]">
                       <Download className="w-4 h-4" />
                   </button>
               </div>
           </div>

           <div className="overflow-x-auto">
               <table className="w-full border-collapse text-left">
                   <thead>
                       <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#2D3748]">
                           <th className="px-6 py-4">Report ID</th>
                           <th className="px-6 py-4">Title / Signature</th>
                           <th className="px-6 py-4">Type</th>
                           <th className="px-6 py-4">Timestamp</th>
                           <th className="px-6 py-4">Status</th>
                           <th className="px-6 py-4 text-right">Actions</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-[#2D3748]">
                       {reportsList.map((r, i) => (
                         <tr key={i} className="hover:bg-[#1E273A] transition-colors group">
                             <td className="px-6 py-5 font-mono text-[12px] text-indigo-400 font-bold">{r.id}</td>
                             <td className="px-6 py-5">
                                 <div className="flex items-center gap-3">
                                     <div className="p-2 bg-[#252E46] rounded-lg"><FileText className="w-4 h-4 text-slate-400" /></div>
                                     <div>
                                         <p className="text-[14px] font-bold text-white leading-tight">{r.name}</p>
                                         <p className="text-[11px] font-medium text-slate-500 mt-0.5">{r.size}</p>
                                     </div>
                                 </div>
                             </td>
                             <td className="px-6 py-5 text-[13px] text-slate-400 font-medium">{r.type}</td>
                             <td className="px-6 py-5 text-[13px] text-slate-400 font-medium font-mono">{r.date}</td>
                             <td className="px-6 py-5">
                                 <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${r.status === 'Critical Path' || r.status === 'Audit' ? 'bg-rose-900/40 text-rose-400 border-rose-800/30' : 'bg-emerald-900/40 text-emerald-400 border-emerald-800/30'}`}>
                                     {r.status}
                                 </span>
                             </td>
                             <td className="px-6 py-5 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                     <button className="p-2 hover:bg-[#252E46] rounded-lg text-slate-500 hover:text-white transition-all"><Download className="w-4 h-4" /></button>
                                     <button className="p-2 hover:bg-[#252E46] rounded-lg text-slate-500 hover:text-white transition-all"><Share2 className="w-4 h-4" /></button>
                                 </div>
                             </td>
                         </tr>
                       ))}
                   </tbody>
               </table>
           </div>
       </div>

       <div className="mt-8 flex-1 flex flex-col lg:flex-row gap-6 shrink-0">
           <div className="flex-1 bg-gradient-to-br from-[#1A2235] to-[#111623] border border-[#2D3748] rounded-[32px] p-10 relative overflow-hidden flex flex-col justify-between">
                <div className="relative z-10 max-w-sm">
                    <h3 className="text-2xl font-black text-white mb-4 leading-tight">Neural Evidence Hub</h3>
                    <p className="text-[15px] text-slate-400 leading-relaxed font-medium">Access full raw telemetry blobs for any autonomous act. Every agent decision is stored as a verifiable proof of execution.</p>
                </div>
                <div className="mt-10 flex items-center gap-6 relative z-10">
                    <div className="flex -space-x-3">
                        {[1,2,3,4].map(v => (
                            <div key={v} className="w-10 h-10 bg-indigo-500 rounded-full border-4 border-[#1A2235] flex items-center justify-center text-[11px] font-black text-white">ID</div>
                        ))}
                    </div>
                    <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest leading-none">Access Ledger History</span>
                </div>
                <Database className="absolute right-[-40px] bottom-[-40px] w-64 h-64 text-indigo-500/5 rotate-[-15deg]" />
           </div>
           <div className="w-full lg:w-[380px] bg-[#1A2235] border border-[#2D3748] rounded-[32px] p-8">
               <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-[#2D3748] pb-4">Recent Audit Triggers</h4>
               <div className="space-y-6">
                   <AuditTrigger name="SLA Breach Handler" time="02:14 PM" type="Conditional" />
                   <AuditTrigger name="FixAgent Escalation" time="11:45 AM" type="Manual Override" />
                   <AuditTrigger name="Onboarding Provision" time="09:22 AM" type="Routine" />
                   <AuditTrigger name="Database Re-sync" time="08:00 AM" type="Scheduled" />
               </div>
           </div>
       </div>
    </div>
  );
};

const ReportStatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-[#1A2235] border border-[#2D3748] rounded-2xl p-6 flex items-center gap-5 hover:border-indigo-500/30 transition-all">
        <div className={`w-14 h-14 bg-${color}-500/10 rounded-2xl flex items-center justify-center shrink-0`}>
            <Icon className={`w-7 h-7 text-${color}-400`} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-2xl font-black text-white leading-none">{value}</p>
        </div>
    </div>
);

const AuditTrigger = ({ name, time, type }) => (
    <div className="flex items-center justify-between group cursor-pointer">
        <div className="flex flex-col">
            <span className="text-[13px] font-bold text-slate-200 group-hover:text-indigo-400 transition-colors leading-tight">{name}</span>
            <span className="text-[11px] font-medium text-slate-600 leading-tight mt-1">{time}</span>
        </div>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2 py-0.5 border border-[#2D3748] rounded-lg bg-[#151B2B]">{type}</span>
    </div>
);

export default Reports;
