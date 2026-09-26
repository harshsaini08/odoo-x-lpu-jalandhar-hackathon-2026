import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldCheck,
  Package,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react';

interface StockRiskRadarProps {
  data?: {
    summary: {
      criticalCount: number;
      atRiskCount: number;
      watchCount: number;
      safeCount: number;
      overstockedCount: number;
      totalTracked: number;
    };
    items: Array<{
      id: string;
      name: string;
      sku: string;
      category: string;
      currentStock: number;
      reorderPoint: number;
      maximumStock: number;
      riskLevel: 'SAFE' | 'WATCH' | 'AT_RISK' | 'CRITICAL';
      stockoutDays: number;
      pendingInbound: number;
      pendingOutbound: number;
      stockUtilizationPercent: number;
      reason: string;
    }>;
  } | null;
}

export const StockRiskRadar: React.FC<StockRiskRadarProps> = ({ data }) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRITICAL' | 'AT_RISK' | 'SAFE'>('ALL');
  const navigate = useNavigate();

  const summary = data?.summary || {
    criticalCount: 2,
    atRiskCount: 3,
    watchCount: 4,
    safeCount: 11,
    overstockedCount: 1,
    totalTracked: 21,
  };

  const items = data?.items || [];
  const filteredItems = items.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    return item.riskLevel === selectedFilter;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-col justify-between space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Stock Risk Radar
              </h3>
              <p className="text-xs text-slate-400">Inventory Velocity & Depletion Risk Matrix</p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedFilter === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All ({summary.totalTracked})
          </button>
          <button
            onClick={() => setSelectedFilter('CRITICAL')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedFilter === 'CRITICAL'
                ? 'bg-rose-500 text-white shadow-sm font-bold'
                : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            Critical ({summary.criticalCount})
          </button>
          <button
            onClick={() => setSelectedFilter('AT_RISK')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedFilter === 'AT_RISK'
                ? 'bg-amber-500 text-white shadow-sm font-bold'
                : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            At Risk ({summary.atRiskCount})
          </button>
          <button
            onClick={() => setSelectedFilter('SAFE')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedFilter === 'SAFE'
                ? 'bg-emerald-500 text-white shadow-sm font-bold'
                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            Safe ({summary.safeCount})
          </button>
        </div>
      </div>

      {/* Risk Distribution Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Catalog Risk Profile</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {Math.round((summary.safeCount / Math.max(1, summary.totalTracked)) * 100)}% Safe Operating Margin
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
          <div
            style={{ width: `${(summary.criticalCount / summary.totalTracked) * 100}%` }}
            className="bg-rose-500 transition-all"
            title={`Critical: ${summary.criticalCount}`}
          />
          <div
            style={{ width: `${(summary.atRiskCount / summary.totalTracked) * 100}%` }}
            className="bg-amber-500 transition-all"
            title={`At Risk: ${summary.atRiskCount}`}
          />
          <div
            style={{ width: `${(summary.watchCount / summary.totalTracked) * 100}%` }}
            className="bg-blue-400 transition-all"
            title={`Watch: ${summary.watchCount}`}
          />
          <div
            style={{ width: `${(summary.safeCount / summary.totalTracked) * 100}%` }}
            className="bg-emerald-500 transition-all"
            title={`Safe: ${summary.safeCount}`}
          />
        </div>
      </div>

      {/* Interactive Products List */}
      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
        {filteredItems.slice(0, 6).map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/products?search=${item.sku}`)}
            className="pt-2.5 first:pt-0 flex items-center justify-between group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  item.riskLevel === 'CRITICAL'
                    ? 'bg-rose-500 animate-ping'
                    : item.riskLevel === 'AT_RISK'
                    ? 'bg-amber-500'
                    : item.riskLevel === 'WATCH'
                    ? 'bg-blue-400'
                    : 'bg-emerald-500'
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-brand-600 transition-colors">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Stock: <strong>{item.currentStock}</strong></span>
                  <span>•</span>
                  <span>Reorder Point: <strong>{item.reorderPoint}</strong></span>
                  <span>•</span>
                  <span>Coverage: <strong>{item.stockoutDays} days</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  item.riskLevel === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : item.riskLevel === 'AT_RISK'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : item.riskLevel === 'WATCH'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {item.riskLevel.replace('_', ' ')}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <button
        onClick={() => navigate('/intelligence')}
        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center justify-center gap-1 pt-1"
      >
        <span>Open Full Risk Radar & Matrix</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
