import React, { useState } from 'react';
import { Sparkles, HelpCircle, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { HealthScoreData } from '../../types';

interface HealthScoreWidgetProps {
  data?: HealthScoreData | null;
  onExplore?: () => void;
}

export const HealthScoreWidget: React.FC<HealthScoreWidgetProps> = ({ data, onExplore }) => {
  const [showModal, setShowModal] = useState(false);

  const score = data?.score ?? 84;
  const grade = data?.grade ?? 'A';

  const getScoreColor = (s: number) => {
    if (s >= 85) return 'from-emerald-500 to-teal-600 text-emerald-600';
    if (s >= 70) return 'from-blue-500 to-cyan-600 text-blue-600';
    if (s >= 50) return 'from-amber-500 to-yellow-600 text-amber-600';
    return 'from-rose-500 to-red-600 text-rose-600';
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle hover:shadow-card transition-all relative overflow-hidden flex flex-col justify-between">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Inventory Health Score
              </h3>
              <p className="text-xs text-slate-400">Explainable Operations Rating</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
          >
            <span>Why {score}?</span>
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Big Score Gauge */}
        <div className="my-6 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {score}
              </span>
              <span className="text-lg font-bold text-slate-400">/100</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                Grade {grade}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Optimal Stock Velocity
              </span>
            </div>
          </div>

          {/* Mini Breakdown Preview */}
          <div className="space-y-1.5 text-xs text-right">
            <div className="flex items-center justify-end gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Catalog Availability: +{data?.factors?.stockAvailability?.score ?? 31}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Low-Stock Risk: {data?.factors?.lowStockPenalty?.score ?? -5}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Stockout Impact: {data?.factors?.outOfStockPenalty?.score ?? -3}</span>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <button
          onClick={onExplore}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors border border-slate-200/60 dark:border-slate-700/60"
        >
          <span>View Deep Intelligence Analytics</span>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* "Why is my health score X?" Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    Why is my Inventory Health {score}/100?
                  </h3>
                  <p className="text-xs text-slate-400">Transparent Rule-Based Scoring Matrix</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Factor Breakdown */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {data?.factors &&
                Object.entries(data.factors).map(([key, f]) => (
                  <div
                    key={key}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {f.score >= 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        )}
                        <span>{f.label}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{f.details}</div>
                    </div>
                    <div
                      className={`font-mono font-bold text-sm ${
                        f.score >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {f.score >= 0 ? `+${f.score}` : f.score}
                    </div>
                  </div>
                ))}
            </div>

            {/* Actionable Insights */}
            {data?.actionableInsights && data.actionableInsights.length > 0 && (
              <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60 space-y-2">
                <div className="text-xs font-bold text-brand-900 dark:text-brand-200 uppercase tracking-wider">
                  Recommended Actions to Reach 100:
                </div>
                <ul className="text-xs text-brand-800 dark:text-brand-300 space-y-1 list-disc pl-4">
                  {data.actionableInsights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs rounded-xl transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
};
