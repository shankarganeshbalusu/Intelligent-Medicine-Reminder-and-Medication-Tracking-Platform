import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import History from './pages/History';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PrescriptionOCR from './pages/PrescriptionOCR';
import { authService } from './services/auth';
import { usersService } from './services/users';
import {
  Pill,
  Activity,
  HeartPulse,
  Plus,
  Heart,
  MessageSquare,
  Send,
  Sparkles,
  X,
  Loader2
} from 'lucide-react';

// Helper component to guard routes that require authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = authService.isAuthenticated();
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const [user, setUser] = useState<any>(null);
  
  // Global Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hi! I am your PillSync AI Assistant. Ask me anything about your active medications, food instructions, side effects, or compliance score!' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const handleAuthChange = () => {
    setUser(authService.getCurrentUser());
  };

  const handleSendChatMessage = async (msgText?: string) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim()) return;

    const updatedMessages = [...chatMessages, { sender: 'user' as const, text: textToSend }];
    setChatMessages(updatedMessages);
    if (!msgText) setChatInput('');
    setChatLoading(true);

    try {
      const response = await usersService.askChatbot(textToSend);
      setChatMessages(prev => [...prev, { sender: 'ai' as const, text: response.reply }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { sender: 'ai' as const, text: 'Sorry, I am having trouble connecting right now. Please check back soon!' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen vibrant-mesh-bg text-slate-100 relative overflow-hidden">
        {/* Floating Medicine Background Logos */}
        <div className="absolute top-[12%] left-[8%] text-brand-500/10 animate-float-slow pointer-events-none">
          <Pill className="h-28 w-28 rotate-45 filter drop-shadow-[0_0_15px_rgba(14,144,233,0.1)]" />
        </div>
        <div className="absolute top-[48%] right-[6%] text-brand-600/10 animate-float-delayed pointer-events-none">
          <Activity className="h-32 w-32 filter drop-shadow-[0_0_15px_rgba(2,114,199,0.1)]" />
        </div>
        <div className="absolute bottom-[18%] left-[6%] text-emerald-500/10 animate-float-slow pointer-events-none">
          <HeartPulse className="h-28 w-28 filter drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]" />
        </div>
        <div className="absolute top-[22%] right-[32%] text-cyan-500/10 animate-float-delayed pointer-events-none">
          <Plus className="h-24 w-24 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.1)]" />
        </div>
        <div className="absolute bottom-[35%] right-[22%] text-indigo-500/10 animate-float-slow pointer-events-none">
          <Pill className="h-24 w-24 -rotate-12 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.1)]" />
        </div>
        <div className="absolute top-[65%] left-[25%] text-brand-500/10 animate-float-delayed pointer-events-none">
          <Heart className="h-20 w-20 filter drop-shadow-[0_0_15px_rgba(14,144,233,0.08)]" />
        </div>

        <Navbar user={user} onLogout={handleAuthChange} onAskAI={() => setChatOpen(prev => !prev)} />
        <main className="flex-grow flex items-center justify-center py-10 px-4 relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={
                authService.isAuthenticated() ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLoginSuccess={handleAuthChange} />
                )
              } 
            />
            <Route 
              path="/register" 
              element={
                authService.isAuthenticated() ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Register onLoginSuccess={handleAuthChange} />
                )
              } 
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/medicines" 
              element={
                <ProtectedRoute>
                  <Medicines />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prescription-ocr" 
              element={
                <ProtectedRoute>
                  <PrescriptionOCR />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } 
            />
            {/* Fallback route */}
            <Route 
              path="*" 
              element={<Navigate to={authService.isAuthenticated() ? "/dashboard" : "/login"} replace />} 
            />
          </Routes>
        </main>
        
        {/* Global Floating AI Chatbot Assistant Widget */}
        {user?.role === 'patient' && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Panel */}
            {chatOpen && (
              <div className="mb-4 w-[360px] sm:w-[380px] h-[500px] bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up select-none">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-600 to-indigo-600 p-4 text-white flex justify-between items-center shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/10 rounded-xl">
                      <Sparkles className="h-5 w-5 text-yellow-300 animate-spin-slow" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black tracking-wide text-white">PillSync AI Assistant</h4>
                      <span className="text-[10px] text-brand-100 font-bold uppercase tracking-wider block">Clinical Safety Copilot</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Chat Message list */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 flex flex-col text-slate-800">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm font-medium ${
                        msg.sender === 'user'
                          ? 'bg-brand-600 text-white self-end rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-800 self-start rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="bg-white border border-slate-200 text-slate-500 self-start rounded-2xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-1.5 shadow-sm animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin text-brand-500" />
                      <span>AI is formulating advice...</span>
                    </div>
                  )}
                </div>

                {/* Suggestions shortcuts */}
                <div className="px-4 py-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
                  <button
                    onClick={() => handleSendChatMessage('Check my compliance score')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-colors"
                  >
                    📊 Compliance Report
                  </button>
                  <button
                    onClick={() => handleSendChatMessage('What are common medication side effects?')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-colors"
                  >
                    💊 Side Effects Info
                  </button>
                  <button
                    onClick={() => handleSendChatMessage('Tips for taking Metformin')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-colors"
                  >
                    🍽️ Food Guide
                  </button>
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-slate-150 bg-white flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a medical safety question..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendChatMessage();
                    }}
                    className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
                  />
                  <button
                    onClick={() => handleSendChatMessage()}
                    className="p-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl shadow-sm transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Toggle Button */}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="p-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:scale-105 active:scale-95 text-white rounded-full shadow-2xl transition-all flex items-center justify-center relative overflow-hidden"
              title="AI Health Assistant"
            >
              <Sparkles className="absolute top-1 right-1 h-3.5 w-3.5 text-yellow-300 animate-pulse" />
              <MessageSquare className="h-6 w-6" />
            </button>
          </div>
        )}
        
        <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} PillSync. Intelligent Medicine Reminder & Tracking Platform.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
