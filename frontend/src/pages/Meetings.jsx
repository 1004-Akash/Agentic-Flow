import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
    Mic, MicOff, Users, PhoneOff, Activity, MessageSquare, Zap, Monitor,
    Settings as SettingsIcon, Shield, Share2, Clipboard, Layout, UserPlus, Clock
} from 'lucide-react';

const Meetings = ({ triggerMeetingDemo, loading: globalLoading }) => {
    const { id: routeMeetingId } = useParams();
    const [userName, setUserName] = useState(() => routeMeetingId ? "" : "Alex Chen");
    const [isInMeeting, setIsInMeeting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcriptSegments, setTranscriptSegments] = useState([]);
    const [participants, setParticipants] = useState(routeMeetingId ? [] : ["Alex Chen (You)"]);
    const [meetingId, setMeetingId] = useState(routeMeetingId || null);
    const recognitionRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        const final = event.results[i][0].transcript;
                        const segment = { user: userName || "Alex Chen", text: final, timestamp: new Date().toLocaleTimeString() };
                        setTranscriptSegments(prev => [...prev, segment]);
                        if (socketRef.current) socketRef.current.send(final);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };

            recognitionRef.current.onerror = (e) => {
                console.error("Speech Recognition Error:", e);
                setIsListening(false);
            };
        }
    }, []);

    const joinMeeting = (e) => {
        if (e) e.preventDefault();
        let currentUserName = userName;
        if (routeMeetingId && !currentUserName) {
            currentUserName = prompt("Enter your name to join the meeting:", "Kamal");
            if (!currentUserName) currentUserName = "Kamal";
            setUserName(currentUserName);
        } else if (!currentUserName) {
            currentUserName = "Alex Chen";
            setUserName(currentUserName);
        }
        
        const id = routeMeetingId || meetingId || "MT-" + Math.floor(Math.random() * 1000000);
        setMeetingId(id);
        setIsInMeeting(true);

        socketRef.current = new WebSocket(`ws://localhost:8000/ws/${encodeURIComponent(id)}/${encodeURIComponent(currentUserName)}`);
        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'transcript') {
                setTranscriptSegments(prev => [...prev, { user: data.user, text: data.text, timestamp: new Date().toLocaleTimeString() }]);
            } else if (data.type === 'users') {
                setParticipants(data.users);
            }
        };
    };

    // Handled by explicit user click to prevent popup blockers
    useEffect(() => {
    }, [routeMeetingId]);

    const leaveMeeting = () => {
        stopListening();
        if (socketRef.current) socketRef.current.close();
        setIsInMeeting(false);
        setTranscriptSegments([]);
    };

    const startListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.start();
            setIsListening(true);
        } else {
            alert("Voice input is not supported in this browser.");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const finalizeMeeting = async () => {
        const fullText = transcriptSegments.map(s => `${s.user}: ${s.text}`).join("\n");
        if (!fullText) {
            alert("Transcript is empty. No intelligence to synthesize.");
            return;
        }
        await triggerMeetingDemo(fullText);
        leaveMeeting();
    };

    const fallbackCopy = (text) => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            if (document.execCommand('copy')) {
                 alert('Meeting link copied to clipboard!');
            } else {
                 prompt('Copy this meeting link:', text);
            }
            document.body.removeChild(textArea);
        } catch(e) {
            prompt('Copy this meeting link:', text);
        }
    };

    const handleShareLink = () => {
        const link = `${window.location.origin}/meeting/${meetingId}`;
        getComputedStyle(document.body); // force reflow just in case
        if (navigator.clipboard !== undefined && window.isSecureContext) {
            navigator.clipboard.writeText(link).then(() => {
                alert('Meeting link copied to clipboard!');
            }).catch(() => {
                fallbackCopy(link);
            });
        } else {
            fallbackCopy(link);
        }
    };

    if (!isInMeeting) {
        return (
            <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scroll flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1A2235] to-[#111623]">
                <div className="w-full max-w-2xl bg-[#151B2B] border border-[#2D3748] rounded-[40px] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.6)] text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6">
                        <Shield className="w-6 h-6 text-indigo-500/20" />
                    </div>

                    <div className="w-24 h-24 bg-indigo-600/10 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-indigo-600/20 relative group">
                        <Layout className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl border-4 border-[#151B2B] flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    <h2 className="text-[36px] font-black text-white mb-4 tracking-tighter">Strategic Intelligence <span className="text-indigo-400">Lobby</span></h2>
                    <p className="text-slate-400 text-[16px] font-medium max-w-md mx-auto leading-relaxed mb-12">Capture live meeting telemetry with real-time speech-to-text synthesis. All transcript data is processed through the 7-Agent squadron.</p>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="p-4 bg-[#111623] rounded-2xl border border-[#2D3748] text-left">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Encrypted Audio</p>
                            <p className="text-[14px] font-bold text-slate-300">Active Pipeline</p>
                        </div>
                        <div className="p-4 bg-[#111623] rounded-2xl border border-[#2D3748] text-left">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Neural Model</p>
                            <p className="text-[14px] font-bold text-slate-300">Llama-3 (8B)</p>
                        </div>
                    </div>

                    <button
                        onClick={joinMeeting}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[15px] py-5 rounded-3xl shadow-[0_20px_40px_rgba(79,70,229,0.4)] hover:shadow-[0_25px_50px_rgba(79,70,229,0.5)] transition-all transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-4 group"
                    >
                        <Monitor className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        <span>{routeMeetingId ? "Join Secure Meeting Node" : "Initialize Secure Meeting Node"}</span>
                    </button>

                    <div className="mt-8 flex items-center justify-center gap-6">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(v => (
                                <div key={v} className="w-10 h-10 rounded-full bg-[#1A2235] border-2 border-[#151B2B] flex items-center justify-center text-[11px] font-black text-slate-500">U</div>
                            ))}
                            <div className="w-10 h-10 rounded-full bg-indigo-900 border-2 border-[#151B2B] flex items-center justify-center text-[10px] font-black text-indigo-200">+12</div>
                        </div>
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Active Fleet Deployment</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0B0F19]">
            {/* MEETING TOOLBAR / HEADER */}
            <div className="h-16 px-8 flex items-center justify-between border-b border-[#2D3748] bg-[#111623] shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-[#052e16] px-3 py-1 rounded-full border border-[#065f46]">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">Live Link: {meetingId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[13px] font-bold">
                        <Clock className="w-4 h-4" />
                        <span>00:12:45</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={isListening ? stopListening : startListening}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-[#1A2235] text-slate-400 hover:text-white'}`}
                        title={isListening ? "Stop Listening" : "Start Listening"}
                    >
                        {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                    <button className="w-12 h-12 bg-[#1A2235] rounded-xl flex items-center justify-center text-slate-400 hover:text-white" title="Screen Share"><Monitor className="w-5 h-5" /></button>
                    <div className="w-[1px] h-6 bg-[#2D3748] mx-2"></div>
                    <button onClick={leaveMeeting} className="h-12 px-6 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[13px] rounded-xl flex items-center gap-3 transition-all">
                        <PhoneOff className="w-4 h-4" />
                        Leave
                    </button>
                    <button
                        onClick={finalizeMeeting}
                        disabled={globalLoading || transcriptSegments.length === 0}
                        className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[13px] rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50 transition-all ml-2"
                    >
                        <Zap className={`w-4 h-4 ${globalLoading ? 'animate-spin' : ''}`} />
                        Finalize & Synthesize
                    </button>
                </div>

                <div className="flex items-center gap-4 border-l border-[#2D3748] pl-6 ml-2">
                    <div className="flex -space-x-2">
                        {participants.map((p, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-[#111623] flex items-center justify-center text-[10px] font-bold text-white uppercase" title={p}>{p.substring(0, 2)}</div>
                        ))}
                        <div className="w-8 h-8 rounded-full bg-indigo-900 border-2 border-[#111623] flex items-center justify-center text-[10px] font-bold text-white"><UserPlus className="w-3.5 h-3.5" /></div>
                    </div>
                </div>
            </div>

            {/* MAIN MEETING VIEW */}
            <div className="flex-1 flex overflow-hidden">
                {/* GRID OF USERS */}
                <div className="flex-1 p-8 grid grid-cols-2 gap-8 overflow-y-auto custom-scroll">
                    {participants.map((p, i) => (
                        <div key={i} className={`bg-[#151B2B] rounded-[32px] border-2 transition-all relative flex flex-col items-center justify-center overflow-hidden ${(p.includes(userName) && isListening) ? 'border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.2)]' : 'border-[#2D3748]'}`}>
                            <div className="flex flex-col items-center relative z-10">
                                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-3xl font-black text-white mb-4 border-4 border-[#111623] shadow-xl uppercase">
                                    {p.substring(0, 2)}
                                </div>
                                <h4 className="text-[17px] font-bold text-white tracking-tight">{p}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`w-2 h-2 rounded-full ${isListening && p.includes(userName) ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)] animate-pulse' : 'bg-slate-600'}`}></div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{isListening && p.includes(userName) ? 'Transcribing Live' : 'Nominal'}</span>
                                </div>
                            </div>
                            {/* Audio Wavefront Mockup for active speaker */}
                            {isListening && p.includes(userName) && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-20">
                                    <div className="w-full flex items-center justify-center gap-1.5 h-48 px-20">
                                        {[1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1].map((h, k) => (
                                            <div key={k} className="flex-1 bg-indigo-500 rounded-full transition-all duration-75" style={{ height: `${Math.random() * 100}%` }}></div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="absolute top-6 right-8 flex gap-2">
                                <button className="p-2.5 bg-white/5 rounded-xl text-slate-500 hover:text-white"><Zap className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}

                    {/* Empty slots to make a grid */}
                    <div 
                        onClick={handleShareLink}
                        className="bg-[#151B2B]/40 rounded-[32px] border-2 border-dashed border-[#2D3748] flex items-center justify-center flex-col gap-4 group cursor-pointer hover:bg-[#151B2B]/60 transition-all"
                    >
                        <div className="w-16 h-16 rounded-full bg-[#1A2235] flex items-center justify-center text-slate-600 group-hover:text-indigo-400 transition-colors">
                            <Share2 className="w-6 h-6" />
                        </div>
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest leading-none">Invite Field Operatives</p>
                    </div>
                </div>

                {/* SIDEBAR: LIVE TRANSCRIPTION */}
                <div className="w-[380px] border-l border-[#2D3748] flex flex-col bg-[#111623]">
                    <div className="p-6 border-b border-[#2D3748] flex justify-between items-center">
                        <div>
                            <h4 className="text-[15px] font-bold text-white tracking-tight leading-tight">Live Intelligence Loop</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Multi-User Provenance</p>
                        </div>
                        <div className="p-2 bg-indigo-500/10 rounded-lg"><MessageSquare className="w-4 h-4 text-indigo-400" /></div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
                        {transcriptSegments.map((s, i) => (
                            <div key={i} className="flex flex-col gap-2 group">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[12px] font-black text-indigo-400">{s.user}</span>
                                    <span className="text-[10px] font-bold text-slate-600 font-mono">{s.timestamp}</span>
                                </div>
                                <div className="bg-[#1A2235] p-4 rounded-2xl border border-[#2D3748] group-hover:border-indigo-500/30 transition-all shadow-inner">
                                    <p className="text-[13px] text-slate-300 leading-relaxed">{s.text}</p>
                                </div>
                            </div>
                        ))}
                        {transcriptSegments.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-30">
                                <Mic className="w-12 h-12 text-slate-600 mb-4" />
                                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Awaiting Neural Signals...<br />Click the Mic to Begin.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-[#2D3748] bg-[#0B0F19]">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            <span className="text-[11px] font-bold text-emerald-500/80 uppercase tracking-widest">End-to-End Encrypted</span>
                        </div>
                        <div className="relative group">
                            <button onClick={handleShareLink} className="w-full h-12 bg-[#1A2235] border border-[#2D3748] hover:border-indigo-500/50 rounded-xl px-4 flex items-center justify-between transition-all">
                                <span className="text-[12px] font-bold text-slate-400">Share Meeting Link</span>
                                <Clipboard className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Meetings;
