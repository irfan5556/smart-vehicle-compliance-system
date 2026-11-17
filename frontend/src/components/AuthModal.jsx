import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  Sparkles, 
  ArrowRight, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, showToast }) {
  const { 
    authModalMode, 
    setAuthModalMode, 
    login, 
    register, 
    loading 
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const isLogin = authModalMode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isLogin) {
      const res = await login(email, password);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Welcome Back!',
          message: `Logged in successfully as ${email}`
        });
      } else {
        setError(res.error || 'Failed to authenticate');
      }
    } else {
      const res = await register(username, email, password, phoneNumber);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Account Created',
          message: `Welcome, ${username}! Your account has been registered.`
        });
      } else {
        setError(res.error || 'Registration failed');
      }
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword, roleLabel) => {
    setError(null);
    setEmail(demoEmail);
    setPassword(demoPassword);
    const res = await login(demoEmail, demoPassword);
    if (res.success) {
      showToast({
        type: 'success',
        title: `Logged in as ${roleLabel}`,
        message: `Authenticated with ${roleLabel} privileges.`
      });
    } else {
      setError(res.error || `Failed to sign in as ${roleLabel}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isLogin ? 'Sign In to Portal' : 'Create New Account'}
              </h2>
              <p className="text-xs text-slate-300">
                JWT Authentication & Role Scoping
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Login Banner */}
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Instant Demo Sign In</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@compliance.com', 'admin123', 'Admin')}
              className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-0.5"
            >
              <span>Log in as Admin</span>
              <span className="text-[10px] font-normal opacity-85">Full Fleet & Audit</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('user@compliance.com', 'user123', 'Regular User')}
              className="px-3 py-2 bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-700 hover:to-sky-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-0.5"
            >
              <span>Log in as User</span>
              <span className="text-[10px] font-normal opacity-85">Personal Garage</span>
            </button>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => { setAuthModalMode('login'); setError(null); }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              isLogin 
                ? 'border-brand-600 text-brand-600 bg-brand-50/40' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthModalMode('register'); setError(null); }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              !isLogin 
                ? 'border-brand-600 text-brand-600 bg-brand-50/40' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. rahul_sharma"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@compliance.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Phone Number (SMS Notifications)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Credential Reference for Examiners / Reviewers */}
          <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Admin: admin@compliance.com (admin123)</span>
            <span>User: user@compliance.com (user123)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

