import { Link, useNavigate } from 'react-router-dom';
import { Pill, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { authService } from '../services/auth';

interface NavbarProps {
  user: any;
  onLogout: () => void;
  onAskAI?: () => void;
}

export default function Navbar({ user, onLogout, onAskAI }: NavbarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="bg-white/70 sticky top-0 z-50 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <Pill className="h-6 w-6 text-brand-500 animate-heartbeat" />
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                PillSync
              </span>
            </Link>
            {user && (
              <div className="flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-slate-600 hover:text-brand-500 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/medicines"
                  className="text-sm font-medium text-slate-600 hover:text-brand-500 transition-colors"
                >
                  Medicines
                </Link>
                <Link
                  to="/prescription-ocr"
                  className="text-sm font-medium text-slate-600 hover:text-brand-500 transition-colors"
                >
                  Prescription OCR
                </Link>
                <Link
                  to="/history"
                  className="text-sm font-medium text-slate-600 hover:text-brand-500 transition-colors"
                >
                  History
                </Link>
                {user?.role === 'patient' && onAskAI && (
                  <button
                    onClick={onAskAI}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-bold rounded-full shadow-md shadow-brand-100/30 hover:shadow-lg transition-all"
                  >
                    <Sparkles className="h-3 w-3 text-yellow-300 animate-pulse" />
                    <span>Ask AI</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-sm font-medium text-slate-700">{user.name}</span>
                  <span className="text-xs text-slate-400 capitalize">{user.role}</span>
                </div>
                
                <Link
                  to="/profile"
                  className="p-2 rounded-full text-slate-500 hover:text-brand-500 hover:bg-slate-50 transition-colors"
                  title="Profile"
                >
                  <UserIcon className="h-5 w-5" />
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-brand-600 px-3 py-2 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg shadow-sm shadow-brand-100 hover:shadow-md transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
