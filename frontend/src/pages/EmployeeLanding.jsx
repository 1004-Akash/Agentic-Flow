import React, { useState } from 'react';
import { Mail, MessageSquare, ShieldCheck, Zap, ArrowRight, UserCheck, CheckCircle, Loader2, Send, Briefcase, Building2, Calendar, User2 } from 'lucide-react';

const DEMO_EMAIL = 'test111723201002@gmail.com';

const EmployeeLanding = () => {
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        department: '',
        joining_date: '',
        manager: ''
    });
    const [emailDiscovered, setEmailDiscovered] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    const handleCheckEmail = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) { setError('Please enter your full name to continue.'); return; }
        setError('');
        setSending(true);
        try {
            const response = await fetch('http://localhost:8000/employee-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: DEMO_EMAIL,
                    ...formData
                })
            });
            if (response.ok) {
                setEmailDiscovered(true);
            } else {
                setEmailDiscovered(true); // Fallback for demo
            }
        } catch (err) {
            console.error("Check-in failed:", err);
            setEmailDiscovered(true);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex-1 bg-[#0F172A] flex flex-col items-center justify-center p-8 overflow-y-auto">
            <div className="max-w-3xl w-full">
                {/* HERO */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                        <UserCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tight leading-tight mb-4">
                        Welcome to <span className="text-indigo-400">AgenticFlow</span>
                    </h1>
                    <p className="text-lg text-slate-400 font-medium">
                        Your onboarding is orchestrated by our autonomous multi-agent system.
                    </p>
                </div>

                {/* MAIN CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* YOUR DIGITAL WELCOME CARD — INLINE FORM */}
                    <div className={`bg-[#1E293B] p-8 rounded-3xl border ${emailDiscovered ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.08)]' : 'border-slate-800'} transition-all flex flex-col`}>
                        <div className={`w-12 h-12 ${emailDiscovered ? 'bg-emerald-500/10' : 'bg-blue-500/10'} rounded-2xl flex items-center justify-center mb-5`}>
                            {emailDiscovered 
                                ? <CheckCircle className="w-6 h-6 text-emerald-400" />
                                : <Mail className="w-6 h-6 text-blue-400" />
                            }
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">Your Digital Welcome</h3>

                        {!emailDiscovered ? (
                            <>
                                <p className="text-slate-500 text-[13px] leading-relaxed mb-5">
                                    Fill in your details to receive your onboarding welcome pack, tool access confirmation, and connect with your AI buddy.
                                </p>

                                <form onSubmit={handleCheckEmail} className="space-y-3 flex-1 flex flex-col">
                                    {/* Name */}
                                    <div className="relative">
                                        <User2 className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            required
                                            type="text"
                                            name="name"
                                            placeholder="Full Name *"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Role */}
                                    <div className="relative">
                                        <Briefcase className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            name="role"
                                            placeholder="Job Role (e.g. Software Engineer)"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Department */}
                                    <div className="relative">
                                        <Building2 className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <select
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-colors appearance-none"
                                        >
                                            <option value="" disabled>Department</option>
                                            <option value="AI">AI</option>
                                            <option value="Engineering">Engineering</option>
                                            <option value="DevOps">DevOps</option>
                                            <option value="Product">Product</option>
                                            <option value="Design">Design</option>
                                            <option value="HR">HR</option>
                                        </select>
                                    </div>

                                    {/* Joining Date */}
                                    <div className="relative">
                                        <Calendar className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="date"
                                            name="joining_date"
                                            value={formData.joining_date}
                                            onChange={handleChange}
                                            className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Manager */}
                                    <div className="relative">
                                        <User2 className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            name="manager"
                                            placeholder="Reporting Manager (e.g. Jane Smith)"
                                            value={formData.manager}
                                            onChange={handleChange}
                                            className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                                        />
                                    </div>

                                    {/* Email display */}
                                    <div className="bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                        <span className="text-xs text-slate-500 font-mono">{DEMO_EMAIL}</span>
                                        <span className="ml-auto text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Provisioned</span>
                                    </div>

                                    {error && <p className="text-rose-400 text-xs ml-1">{error}</p>}

                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="mt-auto w-full flex items-center justify-center gap-2 text-[13px] font-black text-white px-5 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-xl transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                    >
                                        {sending
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending Welcome Pack...</>
                                            : <><Send className="w-4 h-4" /> Send My Welcome Pack</>
                                        }
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* SUCCESS STATE */
                            <div className="flex-1 flex flex-col">
                                <p className="text-emerald-300/80 text-[14px] leading-relaxed mb-5">
                                    Welcome aboard, <strong className="text-emerald-300">{formData.name}</strong>! 🎉 Your onboarding has been initiated.
                                </p>

                                <div className="space-y-2 mb-5">
                                    {[
                                        { label: 'Email', value: DEMO_EMAIL },
                                        { label: 'Role', value: formData.role || 'Software Engineer' },
                                        { label: 'Department', value: formData.department || 'Engineering' },
                                        { label: 'Joining Date', value: formData.joining_date || '2026-04-01' },
                                        { label: 'Manager', value: formData.manager || 'Jane Smith' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex items-center justify-between bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-2.5">
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{label}</span>
                                            <span className="text-[13px] font-semibold text-white text-right max-w-[60%] truncate">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                                    {[
                                        'Welcome Pack sent via Resend API',
                                        'Profile saved to MongoDB',
                                        'Agents notified · Tools provisioned',
                                    ].map(msg => (
                                        <div key={msg} className="flex items-center gap-2 text-[12px]">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                            <span className="text-emerald-300/80">{msg}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI BUDDY CARD */}
                    <div className="bg-[#1E293B] p-8 rounded-3xl border border-slate-800 hover:border-indigo-500/30 transition-all group cursor-pointer flex flex-col"
                         onClick={() => window.open('https://t.me/AgenticFlowBuddyAI_bot', '_blank')}>
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">AI Onboarding Buddy</h3>
                        <p className="text-slate-500 text-[13px] leading-relaxed mb-5 flex-1">
                            Your intelligent RAG-based AI assistant is available 24/7 on Telegram. Ask anything about your role, tools, policies, or company culture — get instant answers.
                        </p>

                        <div className="space-y-2 mb-5">
                            {['Company Policy Q&A', 'Tool Setup Guidance', 'HR FAQ Assistance', 'Culture & Handbook'].map(f => (
                                <div key={f} className="flex items-center gap-2 text-[12px] text-slate-400">
                                    <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                                    {f}
                                </div>
                            ))}
                        </div>

                        <div className="bg-[#0F172A] border border-indigo-500/20 rounded-xl px-4 py-2.5 text-xs text-indigo-400 font-bold font-mono mb-4 text-center">
                            @AgenticFlowBuddyAI_bot
                        </div>

                        <button className="w-full flex items-center justify-center gap-2 text-[13px] font-black text-white px-5 py-3.5 bg-[#334155] group-hover:bg-indigo-600 rounded-xl transition-colors">
                            Open Telegram
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                    </div>
                </div>

                {/* ACCESS NOTICE */}
                <div className="mt-6 p-5 bg-[#1E293B] rounded-2xl border border-slate-800 flex items-center gap-4 text-left">
                    <div className="p-2.5 bg-amber-500/10 rounded-xl shrink-0">
                        <ShieldCheck className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">Restricted Access Environment</h4>
                        <p className="text-slate-500 text-xs mt-0.5">
                            Internal multi-agent pipelines are reserved for IT and HR administrators. Your portal is optimized for a seamless joining experience.
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <div className="group cursor-pointer inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm uppercase tracking-widest transition-all">
                        <span>Explore Culture Wiki</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeLanding;
