import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import Agents from './pages/Agents';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Support from './pages/Support';
import EmployeeLanding from './pages/EmployeeLanding';
import { UserCheck, ShieldCheck, Zap, Activity, Eye, EyeOff, ArrowLeft, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://localhost:8000';

// ─── CREDENTIALS ───────────────────────────────────────────────────────────────
const CREDENTIALS = {
  admin:    { username: 'admin',    password: 'admin@123' },
  employee: { username: 'newjoinee', password: 'joinee@123' },
};

// ─── LOGIN PAGE ────────────────────────────────────────────────────────────────
function LoginPage({ role, onSuccess, onBack }) {
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd,  setShowPwd]    = useState(false);
  const [error,    setError]      = useState('');
  const [loading,  setLoading]    = useState(false);

  const isAdmin = role === 'admin';
  const cred = CREDENTIALS[role];

  // Concrete classes — Tailwind cannot handle dynamic interpolation
  const badgeCls   = isAdmin ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400';
  const dotCls     = isAdmin ? 'bg-indigo-400' : 'bg-blue-400';
  const iconBgCls  = isAdmin ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-blue-500/10 border-blue-500/20';
  const iconTxtCls = isAdmin ? 'text-indigo-400' : 'text-blue-400';
  const inputFocus = isAdmin ? 'focus:border-indigo-500' : 'focus:border-blue-500';
  const btnCls     = isAdmin ? 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_24px_rgba(79,70,229,0.25)]' : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_24px_rgba(37,99,235,0.25)]';
  const accentBar  = isAdmin ? 'bg-indigo-500' : 'bg-blue-500';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    if (username === cred.username && password === cred.password) {
      onSuccess(role);
    } else {
      setError('Invalid username or password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="relative h-screen w-full bg-[#050811] flex items-center justify-center p-6 overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[130px] animate-pulse ${isAdmin ? 'bg-indigo-500/10' : 'bg-blue-600/10'}`} />
        <div className={`absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full blur-[130px] animate-pulse delay-700 ${isAdmin ? 'bg-purple-600/8' : 'bg-cyan-600/8'}`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'circOut' }}
        className="z-10 w-full max-w-md"
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm font-medium mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to portal selection
        </button>

        {/* Card */}
        <div className="bg-[#111827]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[32px] p-10 shadow-2xl">

          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 ${badgeCls}`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotCls}`} />
            {isAdmin ? 'Admin Portal' : 'New Joinee Portal'}
          </div>

          {/* Icon */}
          <div className={`w-16 h-16 border rounded-2xl flex items-center justify-center mb-6 ${iconBgCls}`}>
            {isAdmin
              ? <ShieldCheck className={`w-8 h-8 ${iconTxtCls}`} />
              : <UserCheck className={`w-8 h-8 ${iconTxtCls}`} />
            }
          </div>

          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            {isAdmin ? 'Admin Sign In' : 'New Joinee Sign In'}
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            {isAdmin
              ? 'Access the AgenticFlow control center and multi-agent pipelines.'
              : 'Sign in to your onboarding portal and begin your automated journey.'}
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div className="relative">
              <User className="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                required
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                className={`w-full bg-[#0F172A] border rounded-2xl pl-11 pr-4 py-4 text-sm text-white placeholder-slate-600 outline-none transition-colors ${error ? 'border-rose-500/50' : 'border-slate-800'} ${inputFocus}`}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                required
                type={showPwd ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className={`w-full bg-[#0F172A] border rounded-2xl pl-11 pr-12 py-4 text-sm text-white placeholder-slate-600 outline-none transition-colors ${error ? 'border-rose-500/50' : 'border-slate-800'} ${inputFocus}`}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/[0.08] border border-rose-500/20 rounded-xl px-4 py-3"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Demo Credentials Hint */}
            <div className="bg-[#0F172A] border border-slate-800/80 rounded-xl px-4 py-3 flex items-start gap-3">
              <div className={`w-1 self-stretch rounded ${accentBar}`} />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Demo Credentials</p>
                <p className="text-xs font-mono">
                  <span className="text-slate-300">{cred.username}</span>
                  <span className="text-slate-600"> / </span>
                  <span className="text-slate-300">{cred.password}</span>
                </p>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 disabled:opacity-60 text-white font-black py-4 rounded-2xl text-sm transition-all ${btnCls}`}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
                : <>{isAdmin ? <ShieldCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />} Sign In</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-slate-700 text-[10px] uppercase font-black tracking-[0.3em] mt-8">
          AgenticFlow · Secured by Neural Guard
        </p>
      </motion.div>
    </div>
  );
}


// ─── ROLE CARD ─────────────────────────────────────────────────────────────────
const RoleCard = ({ icon: Icon, title, desc, onClick, sub, gradient, glow }) => (
  <motion.div
    whileHover={{ y: -8, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="relative group cursor-pointer"
  >
    <div
      className="absolute inset-0 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[40px]"
      style={{ backgroundColor: glow }}
    />
    <div className="relative h-[480px] bg-[#111827]/80 backdrop-blur-3xl border-2 border-white/5 group-hover:border-white/10 rounded-[40px] p-12 flex flex-col items-center text-center transition-all overflow-hidden shadow-2xl">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient} opacity-50`} />

      <div className="w-24 h-24 rounded-[32px] bg-slate-900 flex items-center justify-center mb-10 group-hover:bg-slate-800 transition-colors shadow-inner">
        <Icon className="w-12 h-12 text-white group-hover:scale-110 transition-transform duration-500" />
      </div>

      <div className="mb-6">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-3 block opacity-70 group-hover:opacity-100 transition-opacity">{sub}</span>
        <h2 className="text-4xl font-extrabold text-white tracking-tight">{title}</h2>
      </div>

      <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-[280px]">{desc}</p>

      <div className="mt-auto w-full py-5 bg-white/[0.03] group-hover:bg-white/[0.08] border border-white/5 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold text-white transition-all">
        <span>Sign In</span>
        <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
        </motion.div>
      </div>

      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity" />
    </div>
  </motion.div>
);

// ─── LANDING PAGE ───────────────────────────────────────────────────────────────
function LandingPage({ onSelectRole }) {
  return (
    <div className="relative h-screen w-full bg-[#050811] flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_#112244_0%,_transparent_70%)] opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'circOut' }}
        className="z-10 max-w-6xl w-full flex flex-col items-center"
      >
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-6"
          >
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Agentic Enterprise OS v4.0</span>
          </motion.div>
          <h1 className="text-6xl font-black text-white tracking-tighter mb-4">
            Orchestrate <span className="bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent">The Future</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto">
            Select your role to sign in to the AgenticFlow platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full px-4">
          <RoleCard
            icon={ShieldCheck}
            title="Admin"
            desc="Oversee autonomous agents, monitor pipeline integrity, manage enrollments and handle escalations."
            onClick={() => onSelectRole('admin')}
            sub="Administrative Layer"
            gradient="from-indigo-600 to-indigo-900"
            glow="rgba(79, 70, 229, 0.4)"
          />
          <RoleCard
            icon={UserCheck}
            title="New Joinee"
            desc="Experience the automated onboarding journey orchestrated by our multi-agent hive mind."
            onClick={() => onSelectRole('employee')}
            sub="Employee Onboarding Portal"
            gradient="from-blue-600 to-blue-900"
            glow="rgba(37, 99, 235, 0.4)"
          />
        </div>

        <p className="mt-16 text-slate-600 text-[10px] uppercase font-black tracking-[0.4em]">
          Secured by Neural Guard &amp; Multisig Verification
        </p>
      </motion.div>
    </div>
  );
}

// ─── APP CONTENT ────────────────────────────────────────────────────────────────
function AppContent() {
  const [screen, setScreen] = useState(() => {
    if (window.location.pathname.startsWith('/meeting/')) return 'app';
    return 'landing';
  });
  const [userRole, setUserRole] = useState(() => {
    if (window.location.pathname.startsWith('/meeting/')) return 'guest';
    return null;
  });
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meetingText, setMeetingText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (userRole !== 'admin') return;
    const fetchData = async () => {
      try {
        const [tasksRes, logsRes] = await Promise.all([
          axios.get(`${API_URL}/tasks`),
          axios.get(`${API_URL}/logs`),
        ]);
        setTasks(tasksRes.data);
        setLogs(logsRes.data);
      } catch (err) { console.error('Poll error:', err); }
    };
    const interval = setInterval(fetchData, 4000);
    fetchData();
    return () => clearInterval(interval);
  }, [userRole]);

  const handleRoleSelect = (role) => {
    setScreen(role === 'admin' ? 'login-admin' : 'login-employee');
  };

  const handleLoginSuccess = (role) => {
    setUserRole(role);
    setScreen('app');
    navigate(role === 'admin' ? '/admin' : '/joinee');
  };

  const handleLogout = () => {
    setUserRole(null);
    setScreen('landing');
    navigate('/');
  };

  const triggerOnboarding = async (data) => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/onboarding`, { data });
    } catch (err) { alert(`Workflow trigger failed: ${err.message}`); } finally { setLoading(false); }
  };

  const triggerSLADemo = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/sla-breach`, { text: 'Task PO-9921 is stuck with Sarah for 48 hours. This is an SLA risk.' });
      navigate('/admin');
    } catch (err) { alert(`Failed: ${err.message}`); } finally { setLoading(false); }
  };

  const updateTaskStatus = async (taskId, updates) => {
    try {
      await axios.post(`${API_URL}/update-task?task_id=${taskId}`, updates);
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updates } : t));
    } catch (err) { console.error('Update error:', err); }
  };

  const triggerMeetingDemo = async (text) => {
    const content = text || meetingText;
    if (!content) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/meeting-text`, { text: content, email: 'alex@agenticflow.inc' });
      setMeetingText('');
      navigate('/admin');
    } catch (err) { alert(`Failed: ${err.message}`); } finally { setLoading(false); }
  };

  // ── SCREENS ──────────────────────────────────────────────────────────────────
  if (screen === 'landing') {
    return <LandingPage onSelectRole={handleRoleSelect} />;
  }

  if (screen === 'login-admin') {
    return (
      <LoginPage
        role="admin"
        onSuccess={handleLoginSuccess}
        onBack={() => setScreen('landing')}
      />
    );
  }

  if (screen === 'login-employee') {
    return (
      <LoginPage
        role="employee"
        onSuccess={handleLoginSuccess}
        onBack={() => setScreen('landing')}
      />
    );
  }

  // ── MAIN APP ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#0A0E17] text-slate-200 font-sans overflow-hidden">
      {userRole === 'admin' && <Sidebar />}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <TopNav
          triggerOnboardingDemo={triggerOnboarding}
          triggerSLADemo={triggerSLADemo}
          loading={loading}
          userRole={userRole}
          setUserRole={handleLogout}
        />
        <Routes>
          {/* ── ADMIN ROUTES (/admin/*) ── */}
          <Route path="/admin" element={<Dashboard tasks={tasks} logs={logs} updateStatus={updateTaskStatus} triggerOnboarding={triggerOnboarding} loading={loading} />} />
          <Route path="/admin/meetings" element={<Meetings meetingText={meetingText} setMeetingText={setMeetingText} triggerMeetingDemo={triggerMeetingDemo} loading={loading} />} />
          <Route path="/admin/agents" element={<Agents />} />
          <Route path="/admin/tasks" element={<Tasks tasks={tasks} />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/support" element={<Support />} />

          {/* ── NEW JOINEE ROUTE (/joinee) ── */}
          <Route path="/joinee" element={<EmployeeLanding />} />

          {/* ── SHARED MEETING ROUTE ── */}
          <Route path="/meeting/:id" element={<Meetings meetingText={meetingText} setMeetingText={setMeetingText} triggerMeetingDemo={triggerMeetingDemo} loading={loading} />} />

          {/* ── FALLBACK ── */}
          <Route path="*" element={
            userRole === 'admin'
              ? <Dashboard tasks={tasks} logs={logs} updateStatus={updateTaskStatus} triggerOnboarding={triggerOnboarding} loading={loading} />
              : <EmployeeLanding />
          } />
        </Routes>
      </main>
    </div>
  );
}

// ─── ROOT ───────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
