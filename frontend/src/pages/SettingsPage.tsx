import React, { useState } from 'react';
import {
  Settings,
  Shield,
  RotateCcw,
  Sparkles,
  Database,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [leadTimeDefault, setLeadTimeDefault] = useState(5);
  const [safetyBufferFactor, setSafetyBufferFactor] = useState(1.25);
  const [autoReorderAlerts, setAutoReorderAlerts] = useState(true);
  const [anomalyThreshold, setAnomalyThreshold] = useState(25);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'System parameters and reorder engine thresholds updated.',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          System Settings & Platform Parameters
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Reorder algorithm tuning, anomaly sensitivity, and operator profile configurations
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Intelligence Engine Tuning */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              StockSense Intelligence & Reorder Parameters
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Default Supplier Lead Time (Days)
              </label>
              <input
                type="number"
                value={leadTimeDefault}
                onChange={(e) => setLeadTimeDefault(parseInt(e.target.value, 10) || 5)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <p className="text-[10px] text-slate-400">Fallback lead time when unconfigured on supplier</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Safety Stock Multiplier Factor
              </label>
              <input
                type="number"
                step="0.05"
                value={safetyBufferFactor}
                onChange={(e) => setSafetyBufferFactor(parseFloat(e.target.value) || 1.25)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <p className="text-[10px] text-slate-400">Applied to Daily Usage × Sqrt(Lead Time)</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Anomaly Detection Sensitivity (% Variance)
              </label>
              <input
                type="number"
                value={anomalyThreshold}
                onChange={(e) => setAnomalyThreshold(parseInt(e.target.value, 10) || 25)}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <p className="text-[10px] text-slate-400">Flags adjustments exceeding threshold variance</p>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                id="autoReorder"
                checked={autoReorderAlerts}
                onChange={(e) => setAutoReorderAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <label htmlFor="autoReorder" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Generate automatic critical alerts when stock crosses reorder threshold
              </label>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Active Operator Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Logged in Name</span>
              <div className="font-bold text-slate-900 dark:text-slate-100">{user?.name}</div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Email Account</span>
              <div className="font-mono text-slate-700 dark:text-slate-300">{user?.email}</div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Platform Access Role</span>
              <div className="font-bold text-brand-600">{user?.role}</div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Assigned Department</span>
              <div className="font-semibold text-slate-700 dark:text-slate-300">{user?.department || 'Operations'}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md transition-all"
          >
            Save Parameter Changes
          </button>
        </div>
      </form>
    </div>
  );
};
