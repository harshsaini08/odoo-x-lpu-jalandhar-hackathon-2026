import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Check,
  X,
  Filter,
} from 'lucide-react';
import api from '../api/client';
import { Alert } from '../types';
import { useToast } from '../context/ToastContext';

export const AlertsPage: React.FC = () => {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [criticalCount, setCriticalCount] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params: any = { status: statusFilter };
      if (severityFilter !== 'ALL') params.severity = severityFilter;

      const res = await api.get('/alerts', { params });
      if (res.data?.success) {
        setAlerts(res.data.data.items);
        setActiveCount(res.data.data.activeCount);
        setCriticalCount(res.data.data.criticalCount);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const handleResolveAlert = async (id: string) => {
    try {
      const res = await api.put(`/alerts/${id}/resolve`);
      if (res.data?.success) {
        showToast({
          type: 'success',
          title: 'Alert Resolved',
          message: 'Alert has been marked as resolved.',
        });
        fetchAlerts();
      }
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to resolve alert' });
    }
  };

  const handleDismissAlert = async (id: string) => {
    try {
      const res = await api.put(`/alerts/${id}/dismiss`);
      if (res.data?.success) {
        showToast({
          type: 'info',
          title: 'Alert Dismissed',
          message: 'Alert has been dismissed from the active feed.',
        });
        fetchAlerts();
      }
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to dismiss alert' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Inventory Alerts & Exceptions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated notifications for stockouts, low thresholds, negative attempts, and unusual movements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800">
            {criticalCount} Critical
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs">
            {activeCount} Active Total
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'ACTIVE'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === 'RESOLVED'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Resolved History
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              All Clear! No Active Alerts
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              All inventory levels and operations are operating within expected thresholds.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                  : alert.severity === 'WARNING'
                  ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                  : 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="shrink-0 mt-0.5">
                  {alert.severity === 'CRITICAL' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                  {alert.severity === 'WARNING' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                  {alert.severity === 'INFO' && <Info className="w-5 h-5 text-blue-500" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {alert.title}
                    </h4>
                    <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400">
                      {alert.alertType}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {alert.message}
                  </p>
                  {alert.recommendedAction && (
                    <div className="text-[11px] font-semibold text-brand-700 dark:text-brand-300">
                      Recommended Action: {alert.recommendedAction}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400">
                    Logged: {new Date(alert.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {alert.status === 'ACTIVE' && (
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Resolve</span>
                  </button>
                  <button
                    onClick={() => handleDismissAlert(alert.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
