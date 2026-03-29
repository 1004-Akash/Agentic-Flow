import React from 'react';
import { Search, Bell, Radio, Activity } from 'lucide-react';

const TopNav = ({ triggerOnboardingDemo, triggerSLADemo, loading }) => {
  return (
    <header className="h-20 px-8 flex items-center justify-between shrink-0 bg-[#111623]">
       <div className="relative w-[420px] flex items-center">
         <Search className="w-4 h-4 text-slate-500 absolute left-4" />
         <input type="text" placeholder="Search predictive signals..." className="w-full bg-[#151B2B] text-[13px] font-medium text-slate-300 px-11 py-3 rounded-lg border border-transparent focus:outline-none focus:border-[#2D3748] transition-colors" />
       </div>
       
       <div className="flex items-center gap-6">
          <Bell className="w-[18px] h-[18px] text-slate-400 cursor-pointer hover:text-white" />
          <Radio className="w-[18px] h-[18px] text-slate-400 cursor-pointer hover:text-white" />
          
          <div className="flex items-center gap-2 ml-2">
            <button onClick={triggerOnboardingDemo} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-bold px-4 py-2 rounded transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50 flex items-center gap-2">
              {loading && <Activity className="w-3 h-3 animate-spin" />}
              Run Onboarding
            </button>
            <button onClick={triggerSLADemo} disabled={loading} className="bg-rose-600 hover:bg-rose-500 text-white text-[12px] font-bold px-4 py-2 rounded transition-colors shadow-[0_0_15px_rgba(225,29,72,0.3)] disabled:opacity-50 flex items-center gap-2">
              {loading && <Activity className="w-3 h-3 animate-spin" />}
              Run SLA Breach
            </button>
          </div>

          <div className="flex items-center gap-3 pl-6 ml-2 border-l border-[#2D3748]">
             <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center font-bold text-[13px] text-slate-800">AC</div>
             <div>
                <p className="text-[13px] font-bold text-white leading-tight">Alex Chen</p>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wider">Fleet Commander</p>
             </div>
          </div>
       </div>
    </header>
  );
};

export default TopNav;
