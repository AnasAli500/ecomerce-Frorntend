import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Alert from '../components/Alert';

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
                placeholder="Enter email address"
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
                className="input pl-10 pr-10"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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

          {/* WhatsApp Support Link */}
          <div className="mt-5 text-center">
            <a
              href="https://wa.me/252619094928"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all duration-200 group text-xs font-semibold shadow-inner"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </span>
              <div className="text-left flex items-center justify-between w-full">
                <span className="text-slate-400 font-medium">Customer Support:</span>
                <span className="font-bold text-emerald-400 group-hover:text-emerald-300">WhatsApp: 619094928</span>
              </div>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
