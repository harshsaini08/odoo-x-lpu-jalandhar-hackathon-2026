import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingDown,
  Activity,
  Calculator,
  DollarSign,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import api from '../api/client';
import { HealthScoreData, ReorderRecommendation } from '../types';
import { ReorderAdvisorWidget } from '../components/dashboard/ReorderAdvisorWidget';

export const IntelligencePage: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthScoreData | null>(null);
  const [recommendations, setRecommendations] = useState<ReorderRecommendation[]>([]);
  const [agingData, setAgingData] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntelligence = async () => {
    try {
      setLoading(true);
      const [healthRes, reorderRes, agingRes, anomalyRes] = await Promise.all([
        api.get('/intelligence/health'),
        api.get('/intelligence/reorder'),
        api.get('/intelligence/aging'),
        api.get('/intelligence/anomalies'),
      ]);

      if (healthRes.data?.success) setHealthData(healthRes.data.data);
      if (reorderRes.data?.success) setRecommendations(reorderRes.data.data.recommendations || []);
      if (agingRes.data?.success) setAgingData(agingRes.data.data);
      if (anomalyRes.data?.success) setAnomalies(anomalyRes.data.data.anomalies || []);
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white border border-emerald-800/60 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
            STOCKSENSE INTELLIGENCE PLATFORM
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Explainable Decision Intelligence & Anomaly Detection
        </h1>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-1">
          Transparent algorithmic stock scoring, mathematical reorder points, inventory aging categorization, and rule-based anomaly detection.
        </p>
      </div>

      {/* 1. Health Score Factor Deep-Dive */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Inventory Health Score Breakdown ({healthData?.score || 84}/100 - Grade {healthData?.grade || 'A'})
            </h2>
            <p className="text-xs text-slate-400">
              Transparent, deterministic score evaluated across 6 operational dimensions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {healthData?.factors &&
            Object.entries(healthData.factors).map(([key, factor]) => (
              <div
                key={key}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {factor.score >= 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    )}
                    <span>{factor.label}</span>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs ${
                      factor.score >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {factor.score >= 0 ? `+${factor.score}` : factor.score} / {factor.max}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {factor.details}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* 2. Stock Aging Analysis */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Stock Aging & Tied-up Capital Analysis
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Categorizes inventory freshness to identify slow-moving and dead stock
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400">Total Tracked Inventory Value:</span>
            <div className="font-black text-lg text-emerald-600 dark:text-emerald-400">
              ${(agingData?.grandTotalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* 4 Aging Buckets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {(agingData?.buckets || []).map((bucket: any) => (
            <div
              key={bucket.key}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {bucket.label}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      bucket.key === 'fresh'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : bucket.key === 'aging'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : bucket.key === 'slowMoving'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {bucket.key === 'fresh' ? 'Active' : bucket.key === 'aging' ? 'Aging' : bucket.key === 'slowMoving' ? 'Slow' : 'Dead'}
                  </span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">
                  ${Number(bucket.totalValue).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {bucket.totalUnits} units ({bucket.items?.length || 0} SKUs)
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Capital Share</span>
                  <span className="font-bold">{bucket.percentageOfCapital?.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    style={{ width: `${bucket.percentageOfCapital}%` }}
                    className={`h-full rounded-full ${
                      bucket.key === 'fresh'
                        ? 'bg-emerald-500'
                        : bucket.key === 'aging'
                        ? 'bg-blue-500'
                        : bucket.key === 'slowMoving'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Reorder Advisor Deep-Dive Table */}
      <ReorderAdvisorWidget recommendations={recommendations} />

      {/* 4. Rule-Based Anomaly Detection Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Rule-Based Anomaly Detection Feed
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic detection for high-variance adjustments, sudden demand surges, and stockout bottlenecks
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {anomalies.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No anomalies detected in the current operating window.
            </div>
          ) : (
            anomalies.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        a.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {a.severity}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{a.title}</h4>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {a.description}
                  </p>
                  <div className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                    Recommended Action: {a.action}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {a.metric}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
