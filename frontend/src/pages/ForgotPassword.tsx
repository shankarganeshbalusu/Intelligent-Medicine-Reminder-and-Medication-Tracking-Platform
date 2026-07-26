import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { Pill, Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await authService.forgotPassword(email);
      setMessage({
        text: 'If this email is registered, a password reset link has been dispatched! Please check your email inbox (or terminal console logs).',
        type: 'success'
      });
      setEmail('');
    } catch (err: any) {
      setMessage({
        text: err.response?.data?.detail || 'An error occurred. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <Pill className="h-8 w-8 text-brand-600 animate-pulse" />
          <span className="text-2xl font-bold tracking-tight text-slate-900 bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
            PillSync
          </span>
        </Link>
        <h2 className="text-xl font-extrabold text-slate-800">Forgot Password</h2>
        <p className="text-slate-400 text-xs mt-1.5">Enter your email address to receive a secure reset link.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
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
            Request Reset Link
          </button>
        </form>

        <div className="border-t border-slate-100 pt-5 mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
