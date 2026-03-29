import React from 'react';
import { 
  CheckSquare, Clock, Filter, Search, ChevronRight, User, AlertCircle, CheckCircle, Zap
} from 'lucide-react';

const Tasks = ({ tasks = [] }) => {
  return (
    <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scroll flex flex-col bg-[#0B0F19]">
      <div className="mb-10 mt-6 flex justify-between items-center bg-[#151B2B] p-8 rounded-2xl border border-[#2D3748]">
          <div>
              <h2 className="text-[32px] font-bold text-white tracking-tight">Predictive <span className="text-indigo-400">Task Board</span></h2>
              <p className="text-[14px] text-slate-400 mt-1 font-medium italic">Autonomous prioritization and ownership tracking.</p>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 leading-none">Total Active</p>
                  <p className="text-3xl font-black text-white leading-none">{tasks.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                  <CheckSquare className="w-6 h-6 text-white" />
              </div>
          </div>
      </div>

      <div className="mb-6 flex items-center gap-4 sticky top-0 bg-[#0B0F19] py-4 z-10 shrink-0">
          <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Filter task vectors..." className="w-full bg-[#1A2235] border border-[#2D3748] rounded-xl px-12 py-3.5 text-[13px] text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <button className="flex items-center gap-2 px-6 py-3.5 bg-[#1A2235] border border-[#2D3748] rounded-xl text-[13px] font-bold text-slate-400 hover:text-white hover:bg-[#252E46] transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter Logic</span>
          </button>
      </div>

      <div className="space-y-4">
          {tasks && tasks.length > 0 ? tasks.map((t, i) => (
            <div key={t._id || i} className="bg-[#1A2235] border border-[#2D3748] rounded-2xl p-6 hover:border-indigo-500/50 transition-all flex items-center gap-8 group">
                <div className="w-12 h-12 bg-[#151B2B] rounded-xl flex items-center justify-center shrink-0 border border-[#2D3748] group-hover:scale-110 transition-transform">
                    {t.needs_clarification ? <AlertCircle className="w-6 h-6 text-amber-500" /> : <CheckCircle className="w-6 h-6 text-emerald-500" />}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-[17px] font-bold text-white truncate max-w-[400px] leading-tight">{t.task}</h4>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${t.needs_clarification || t.person === 'UNASSIGNED' ? 'bg-[#2d2215] text-amber-500 border-amber-500/30' : 'bg-[#052e16] text-emerald-500 border-emerald-500/30'}`}>
                            {t.needs_clarification || t.person === 'UNASSIGNED' ? 'Awaiting Logic' : 'Nominal'}
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-slate-500">
                            <User className="w-3.5 h-3.5" />
                            <span className="text-[12px] font-medium leading-none">{t.person}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[12px] font-medium leading-none">SLA Progress: {t.progress}%</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                         <div className="w-8 h-8 rounded-full bg-[#252E46] border-2 border-[#1A2235] flex items-center justify-center text-[10px] font-bold text-slate-400 capitalize">{t.person.substring(0,2)}</div>
                    </div>
                    <button className="p-3 hover:bg-[#252E46] rounded-xl transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400" />
                    </button>
                </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center py-24 bg-[#1A2235]/40 border-2 border-dashed border-[#2D3748] rounded-[32px]">
                <CheckSquare className="w-16 h-16 text-slate-700 mb-6 opacity-20" />
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[12px]">No Active Vectors Detected</p>
                <p className="text-slate-600 text-[14px] mt-2 font-medium">Capture intelligence in the <span className="text-slate-400">Meetings</span> tab to generate tasks.</p>
            </div>
          )}
      </div>

      <div className="mt-12 p-8 border border-indigo-500/20 bg-indigo-500/5 rounded-[32px] relative overflow-hidden shrink-0">
          <div className="relative z-10 flex items-center justify-between">
              <div className="max-w-xl">
                  <h3 className="text-xl font-bold text-white mb-2 leading-tight">Autonomous Re-allocation <span className="text-indigo-400">Engine</span></h3>
                  <p className="text-[14px] text-slate-400 leading-relaxed font-medium">The FixAgent is currently monitoring workload distributions. If any cluster node becomes over-encumbered, tactical rerouting will initiate.</p>
              </div>
              <button className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[14px] rounded-xl transition-all shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-[0.98]">Manual Rebalance</button>
          </div>
          <Zap className="absolute right-[-20px] top-[-20px] w-48 h-48 text-indigo-500/5 rotate-12" />
      </div>
    </div>
  );
};

export default Tasks;
