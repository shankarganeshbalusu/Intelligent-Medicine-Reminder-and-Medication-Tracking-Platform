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
import { authService } from './services/auth';
import { Pill, Activity, HeartPulse, Plus, Heart } from 'lucide-react';

// Helper component to guard routes that require authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = authService.isAuthenticated();
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const handleAuthChange = () => {
    setUser(authService.getCurrentUser());
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

        <Navbar user={user} onLogout={handleAuthChange} />
        <main className="flex-grow flex items-center justify-center py-10 px-4 relative z-10">
          <Routes>
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
        
        <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} PillSync. Intelligent Medicine Reminder & Tracking Platform.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
