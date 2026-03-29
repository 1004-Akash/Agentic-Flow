import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Calendar, CheckSquare, FileText, Settings, HelpCircle, Activity
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, to }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex items-center gap-4 px-6 py-3.5 mx-4 mt-1 rounded-xl cursor-pointer transition-all ${
        isActive ? 'bg-[#1A2235] text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
      }`
    }
  >
    <Icon className="w-5 h-5" />
    <span className="font-semibold text-[13px]">{label}</span>
  </NavLink>
);

const Sidebar = () => {
  return (
    <aside className="w-[280px] bg-[#151B2B] flex flex-col justify-between hidden md:flex shrink-0">
      <div>
        <div className="p-8 flex items-center gap-4">
           <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
             <Activity className="w-5 h-5 text-white" />
           </div>
           <div>
             <h1 className="font-bold text-[17px] leading-tight text-white tracking-tight">AgenticFlow</h1>
             <p className="text-[8px] font-bold text-slate-400/80 uppercase tracking-widest leading-none mt-1">Predictive Observatory</p>
           </div>
        </div>
        <div className="mt-2 space-y-1">
           <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
           <SidebarItem icon={Users} label="Agents" to="/agents" />
           <SidebarItem icon={Calendar} label="Meetings" to="/meetings" />
           <SidebarItem icon={CheckSquare} label="Tasks" to="/tasks" />
           <SidebarItem icon={FileText} label="Reports" to="/reports" />
           <SidebarItem icon={Settings} label="Settings" to="/settings" />
        </div>
      </div>
      <div className="mb-8">
         <SidebarItem icon={HelpCircle} label="Support" to="/support" />
      </div>
    </aside>
  );
};

export default Sidebar;
