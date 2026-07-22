import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { Pill, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
      setMessage({ text: 'Invalid or missing password reset parameters.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await authService.resetPassword({
        email,
        token,
        new_password: newPassword
      });
      setMessage({ text: 'Password reset successfully! Redirecting you to login...', type: 'success' });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.detail || 'Failed to reset password. The link may have expired.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <Pill className="h-8 w-8 text-brand-600 animate-pulse" />
          <span className="text-2xl font-bold tracking-tight text-slate-900 bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
            PillSync
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Set New Password</h2>
        <p className="text-slate-400 text-xs mt-1.5">Enter a strong, secure password for your account.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        {!token || !email ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Invalid password reset parameters. Please use the original link from your email notification.</span>
          </div>
        ) : (
          <>
            {message.text && (
              <div className={`p-4 rounded-xl border text-sm flex gap-3 mb-6 ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-100 text-green-700'
                  : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10.5 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10.5 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Reset Password
              </button>
            </form>
          </>
        )}

        <div className="border-t border-slate-100 pt-5 mt-6 text-center">
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-500 hover:text-brand-500 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
