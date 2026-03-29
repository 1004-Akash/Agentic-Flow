import React from 'react';
import { 
  HelpCircle, MessageSquare, Terminal, FileText, ExternalLink, Activity
} from 'lucide-react';

const Support = () => {
  return (
    <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scroll flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_#1A2235_0%,_#111623_100%)]">
       <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-[#1A2235] border border-[#2D3748] rounded-[40px] p-10 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.3)]">
               <div>
                   <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mb-8 shadow-indigo-500/20 shadow-xl">
                       <HelpCircle className="w-8 h-8 text-white" />
                   </div>
                   <h2 className="text-3xl font-black text-white mb-4 leading-tight">Neural Sync Support</h2>
                   <p className="text-[15px] text-slate-400 leading-relaxed font-medium mb-8">
                       Need assistance with agent allocation or SLA breach logic? Our fleet commanders are standing by to help you optimize your autonomous workflows.
                   </p>
               </div>
               <div className="space-y-4">
                   <SupportLink icon={MessageSquare} label="Live Intercom Sync" />
                   <SupportLink icon={Terminal} label="Developer CLI Access" />
                   <SupportLink icon={FileText} label="API Protocol Documentation" />
               </div>
           </div>

           <div className="space-y-8">
               <div className="bg-indigo-600 rounded-[40px] p-10 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                   <h3 className="text-2xl font-black mb-4 relative z-10">Direct Tactical Line</h3>
                   <p className="text-[14px] text-indigo-100 font-bold opacity-80 mb-8 relative z-10">Instant connection to the core AgenticFlow engineering team.</p>
                   <button className="bg-white text-indigo-600 font-black text-[14px] px-8 py-4 rounded-2xl relative z-10 shadow-xl">Open Secure Channel</button>
                   <Activity className="absolute right-[-40px] bottom-[-40px] w-64 h-64 text-white/5 rotate-[-20deg] group-hover:scale-110 transition-transform" />
               </div>

               <div className="bg-[#1A2235] border border-[#2D3748] rounded-[40px] p-10">
                   <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6 border-b border-[#2D3748] pb-4">System Uptime</h4>
                   <div className="flex items-center justify-between">
                       <div className="flex flex-col">
                           <span className="text-4xl font-black text-emerald-400">99.98%</span>
                           <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Global Reliability</span>
                       </div>
                       <div className="flex gap-1 h-12 items-end">
                           {[2,3,2,4,3,5,4,2,3,4].map((h, i) => (
                               <div key={i} className="w-1.5 bg-emerald-500 rounded-full" style={{height: `${h * 20}%`}}></div>
                           ))}
                       </div>
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
};

const SupportLink = ({ icon: Icon, label }) => (
    <div className="flex items-center justify-between p-4 bg-[#151B2B] rounded-2xl border border-[#2D3748] hover:border-indigo-500/50 transition-all cursor-pointer group">
        <div className="flex items-center gap-4">
            <Icon className="w-5 h-5 text-slate-500 group-hover:text-indigo-400" />
            <span className="text-[14px] font-bold text-slate-300 group-hover:text-white">{label}</span>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
);

export default Support;
