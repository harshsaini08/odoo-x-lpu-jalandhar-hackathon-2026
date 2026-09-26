import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  ShieldCheck,
  UserCheck,
  HardHat,
  ArrowRight,
  Lock,
  Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const { login, switchDemoUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('manager@stocksense.io');
  const [password, setPassword] = useState('manager123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showToast({
        type: 'success',
        title: 'Welcome Back',
        message: 'Successfully authenticated to StockSense.',
      });
      navigate('/');
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Authentication Failed',
        message: err.response?.data?.error?.message || 'Invalid email or password credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'INVENTORY_MANAGER' | 'ADMIN' | 'WAREHOUSE_STAFF') => {
    setLoading(true);
    try {
      await switchDemoUser(role);
      showToast({
        type: 'success',
        title: 'Demo Persona Activated',
        message: `Logged in as ${role.replace('_', ' ')}.`,
      });
      navigate('/');
    } catch (err) {
      showToast({ type: 'error', message: 'Quick login failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-950">
          <Layers className="w-7 h-7 animate-pulse" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          STOCKSENSE
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          Intelligent Inventory Operations Platform • Odoo × LPU Hackathon
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 space-y-6">
          {/* Quick Demo Persona Shortcuts */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Instant Hackathon Demo Logins</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('INVENTORY_MANAGER')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-emerald-500/60 text-xs font-semibold text-slate-200 transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-bold text-white">Inventory Manager</div>
                    <div className="text-[10px] text-slate-400">manager@stocksense.io</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-purple-500/60 text-xs font-semibold text-slate-200 transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-bold text-white">Administrator</div>
                    <div className="text-[10px] text-slate-400">admin@stocksense.io</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('WAREHOUSE_STAFF')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-blue-500/60 text-xs font-semibold text-slate-200 transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <HardHat className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-bold text-white">Warehouse Staff</div>
                    <div className="text-[10px] text-slate-400">staff@stocksense.io</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500 font-bold tracking-wider">
                Or Sign In with Credentials
              </span>
            </div>
          </div>

          {/* Standard Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-400 hover:text-brand-300 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Operations Platform'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
