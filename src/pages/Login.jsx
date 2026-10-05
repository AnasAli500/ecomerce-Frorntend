import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import Alert from '../components/Alert';

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('admin@jileelectronics.com');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      toast.success('Welcome back to JILE Electronics!');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@jileelectronics.com');
      setPassword('Admin123!');
    } else {
      setEmail('staff@jileelectronics.com');
      setPassword('Staff123!');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 p-4 overflow-hidden font-sans selection:bg-brand-500 selection:text-white">
      {/* Background Decorative Glow Blobs */}
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-rose-600/15 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        <form
          onSubmit={submit}
          className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-8 shadow-card-dark backdrop-blur-2xl transition-all duration-300 hover:border-slate-700/80"
        >
          {/* Logo Container */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2.5 shadow-2xl shadow-brand-500/20 ring-4 ring-slate-800">
              <img src="/logo.png" alt="JILE Electronics Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
              <span className="text-rose-500">JILE</span>
              <span className="text-brand-400">ELECTRONICS</span>
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Enterprise POS & Inventory Management System
            </p>
          </div>

          {error && (
            <div className="mb-4">
              <Alert type="error">{error}</Alert>
            </div>
          )}

          {/* Email Input */}
          <div className="mb-4">
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                className="input pl-10"
                type="email"
                placeholder="admin@jileelectronics.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label className="label">Password</label>
            <div className="relative">
              <KeyRound size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                className="input pl-10"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition-all duration-200 hover:opacity-95 hover:shadow-xl active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to System</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3.5 text-center">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
              <ShieldCheck size={14} className="text-emerald-400" />
              Quick Demo Accounts
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-brand-300 hover:bg-slate-700 hover:text-white transition"
              >
                Admin Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemo('staff')}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                Staff Demo
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
