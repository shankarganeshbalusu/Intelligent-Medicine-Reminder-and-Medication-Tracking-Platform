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
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar user={user} onLogout={handleAuthChange} />
        <main className="flex-grow flex items-center justify-center py-10 px-4">
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
