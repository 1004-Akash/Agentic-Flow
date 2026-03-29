import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';

const DisabledModule = ({ moduleName }) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center justify-center custom-scroll">
       <div className="w-full max-w-md bg-[#182030] border border-[#2D3748] rounded-[24px] p-10 shadow-[0_0_50px_rgba(0,0,0,0.3)] text-center relative overflow-hidden">
           <div className="w-24 h-24 bg-[#111623] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#2D3748] relative z-10 shadow-inner">
              <CheckSquare className="w-10 h-10 text-slate-500 opacity-50" />
           </div>
           <h2 className="text-[28px] font-bold text-white mb-2 tracking-tight capitalize">{moduleName} Module</h2>
           <p className="text-slate-400 text-[13px] font-medium leading-relaxed">This view is currently disabled to maintain focus on the core Hackathon workflow demonstration.</p>
           <button onClick={() => navigate('/')} className="mt-8 bg-slate-800 hover:bg-slate-700 text-white text-[12px] font-bold px-6 py-2.5 rounded-lg transition-colors border border-slate-700 hover:border-slate-600 shadow-md">
             Return to Dashboard
           </button>
       </div>
    </div>
  );
};

export default DisabledModule;
