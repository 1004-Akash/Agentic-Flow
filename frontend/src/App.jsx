import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
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

const API_URL = 'http://localhost:8000';

function AppContent() {
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meetingText, setMeetingText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, logsRes] = await Promise.all([
          axios.get(`${API_URL}/tasks`),
          axios.get(`${API_URL}/logs`)
        ]);
        setTasks(tasksRes.data);
        setLogs(logsRes.data);
      } catch (err) { console.error("Poll error:", err); }
    };
    const interval = setInterval(fetchData, 4000);
    fetchData();
    return () => clearInterval(interval);
  }, []);

  const triggerOnboardingDemo = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/onboarding`, { text: "John Doe is joining on Monday as a Senior Engineer. Please initiate the standard onboarding protocol including account provisioning and culture integration." });
      navigate('/');
    } catch (err) { alert(`Failed: ${err.message}`); } finally { setLoading(false); }
  };

  const triggerSLADemo = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/sla-breach`, { text: "Procurement Approval PO-9921 has been pending with Sarah for 48 hours without any progress. This is now at high risk of breaching our external vendor SLA." });
      navigate('/');
    } catch (err) { alert(`Failed: ${err.message}`); } finally { setLoading(false); }
  };

  const updateTaskStatus = async (taskId, updates) => {
    try {
      await axios.post(`${API_URL}/update-task?task_id=${taskId}`, updates);
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updates } : t));
    } catch (err) { console.error("Update error:", err); }
  };

  const triggerMeetingDemo = async (text) => {
    const content = text || meetingText;
    if (!content) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/meeting-text`, { 
        text: content, 
        email: "alex@agenticflow.inc" 
      });
      setMeetingText("");
      navigate('/');
    } catch (err) { alert(`Failed: ${err.message}`); } finally { setLoading(false); }
  };

  return (
    <div className="flex h-screen bg-[#111623] text-slate-200 font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <TopNav 
          triggerOnboardingDemo={triggerOnboardingDemo} 
          triggerSLADemo={triggerSLADemo} 
          loading={loading} 
        />
        <Routes>
          <Route path="/" element={<Dashboard tasks={tasks} logs={logs} updateStatus={updateTaskStatus} />} />
          <Route path="/meetings" element={
            <Meetings 
              meetingText={meetingText} 
              setMeetingText={setMeetingText} 
              triggerMeetingDemo={triggerMeetingDemo} 
              loading={loading} 
            />
          } />
          <Route path="/agents" element={<Agents />} />
          <Route path="/tasks" element={<Tasks tasks={tasks} />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/support" element={<Support />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
