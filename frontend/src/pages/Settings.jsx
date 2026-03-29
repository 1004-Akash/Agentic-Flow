import React from 'react';
import { 
  Settings as SettingsIcon, Shield, Database, Cpu, Globe, Key, Bell, Save, AlertTriangle
} from 'lucide-react';

const Settings = () => {
  return (
    <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scroll flex flex-col">
       <div className="mb-10 mt-6 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
          <div>
              <h2 className="text-[32px] font-bold text-white tracking-tight">System <span className="text-indigo-400">Settings</span></h2>
              <p className="text-[14px] text-slate-400 mt-1 font-medium italic">Configure the predictive engine's operational parameters.</p>
          </div>
          <button className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[14px] rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Save className="w-4 h-4" />
              <span>Apply Changes</span>
          </button>
       </div>

       <div className="flex flex-col xl:flex-row gap-10 shrink-0">
           {/* Section 1: AI & API Configuration */}
           <div className="flex-1 space-y-8">
               <SettingsSection title="Neural Pipeline Configuration" icon={Cpu}>
                   <div className="space-y-6">
                       <InputGroup label="LLM Provider Signature" value="OpenRouter / Meta-Llama-3-8B" type="text" disabled />
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <InputGroup label="Context Window Offset" value="8,192 Tokens" type="text" />
                           <InputGroup label="Temperature Variance" value="0.2 (Predictive)" type="text" />
                       </div>
                       <TextAreaGroup label="System Behavioral Prompt Override" value="You are the AgenticFlow Strategic Orchestrator. Maintain 100% autonomy in decision-making..." />
                   </div>
               </SettingsSection>

               <SettingsSection title="API Gateway Keys" icon={Key}>
                   <div className="space-y-6">
                       <InputGroup label="OPENROUTER_API_KEY" value="sk-or-v1-****************************************" type="password" />
                       <InputGroup label="RESEND_API_KEY" value="re-****************" type="password" />
                       <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-4">
                           <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                           <p className="text-[13px] text-amber-500/80 font-medium leading-relaxed">
                               Changes to API keys will require a system re-sync. This may temporarily affect live meeting synthesis.
                           </p>
                       </div>
                   </div>
               </SettingsSection>
           </div>

           {/* Section 2: Infrastructure & Security */}
           <div className="w-full xl:w-[420px] space-y-8">
               <SettingsSection title="Infrastructure Cluster" icon={Database}>
                   <div className="space-y-6">
                       <ToggleGroup label="Autonomous SLA Rerouting" description="Allow FixAgent to bypass human approval for critical SLA breaches." defaultChecked />
                       <ToggleGroup label="Immutable Logging Ledger" description="Enable block-level persistence for all agent decision vectors." defaultChecked />
                       <ToggleGroup label="Regional GPU Overflow" description="Automatically scale to secondary clusters during peak load." />
                   </div>
               </SettingsSection>

               <SettingsSection title="Global Observatory" icon={Globe}>
                   <div className="space-y-6">
                       <div className="flex items-center justify-between p-4 bg-[#151B2B] rounded-2xl border border-[#2D3748] hover:border-indigo-500/30 transition-all cursor-pointer">
                           <div className="flex items-center gap-4">
                               <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                               <span className="text-[14px] font-bold text-white tracking-tight">Main Cluster: us-east-1</span>
                           </div>
                           <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nominal</span>
                       </div>
                       <div className="flex items-center justify-between p-4 bg-[#151B2B] rounded-2xl border border-[#2D3748] opacity-50">
                           <div className="flex items-center gap-4">
                               <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                               <span className="text-[14px] font-bold text-white tracking-tight">Backup Node: eu-west-2</span>
                           </div>
                           <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Idle</span>
                       </div>
                   </div>
               </SettingsSection>

               <SettingsSection title="Notifications" icon={Bell}>
                   <div className="space-y-4">
                       <div className="flex items-center gap-3">
                           <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-[#2D3748] bg-[#1A2235] text-indigo-600 focus:ring-indigo-500" />
                           <span className="text-[13px] font-bold text-slate-300">Slack Dispatch for Failures</span>
                       </div>
                       <div className="flex items-center gap-3">
                           <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-[#2D3748] bg-[#1A2235] text-indigo-600 focus:ring-indigo-500" />
                           <span className="text-[13px] font-bold text-slate-300">Email Executive Summaries</span>
                       </div>
                       <div className="flex items-center gap-3">
                           <input type="checkbox" className="w-4 h-4 rounded border-[#2D3748] bg-[#1A2235] text-indigo-600 focus:ring-indigo-500" />
                           <span className="text-[13px] font-bold text-slate-300">Mobile Alerts for SLA Risk</span>
                       </div>
                   </div>
               </SettingsSection>
           </div>
       </div>
    </div>
  );
};

const SettingsSection = ({ title, icon: Icon, children }) => (
    <div className="bg-[#1A2235] border border-[#2D3748] rounded-[32px] p-8 flex flex-col hover:border-[#2D3748]/80 transition-all shrink-0">
        <div className="flex items-center gap-4 mb-8 border-b border-[#2D3748] pb-6">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <Icon className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-[17px] font-bold text-white tracking-tight">{title}</h3>
        </div>
        {children}
    </div>
);

const InputGroup = ({ label, value, type, disabled }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">{label}</label>
        <input 
            type={type} 
            defaultValue={value} 
            disabled={disabled}
            className={`w-full bg-[#151B2B] border border-[#2D3748] rounded-xl px-4 py-3 text-[14px] text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
        />
    </div>
);

const TextAreaGroup = ({ label, value }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">{label}</label>
        <textarea 
            defaultValue={value}
            className="w-full h-32 bg-[#151B2B] border border-[#2D3748] rounded-xl px-4 py-3 text-[13px] text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed" 
        />
    </div>
);

const ToggleGroup = ({ label, description, defaultChecked }) => (
    <div className="flex items-start justify-between gap-4 p-4 bg-[#151B2B] rounded-2xl border border-[#2D3748]">
        <div className="flex-1">
            <h4 className="text-[14px] font-bold text-white leading-tight">{label}</h4>
            <p className="text-[11px] font-medium text-slate-600 mt-1 leading-relaxed">{description}</p>
        </div>
        <input 
            type="checkbox" 
            defaultChecked={defaultChecked}
            className="w-10 h-5 bg-[#1A2235] rounded-full appearance-none relative checked:bg-indigo-600 transition-colors cursor-pointer before:absolute before:content-[''] before:w-4 before:h-4 before:bg-white before:rounded-full before:top-[2px] before:left-[2px] checked:before:translate-x-5 before:transition-transform shadow-inner" 
        />
    </div>
);

export default Settings;
