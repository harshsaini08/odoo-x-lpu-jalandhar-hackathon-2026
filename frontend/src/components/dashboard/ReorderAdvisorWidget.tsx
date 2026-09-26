import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  HelpCircle,
  ArrowRight,
  TrendingDown,
  Clock,
  Truck,
  CheckCircle2,
  X,
  Plus,
} from 'lucide-react';
import { ReorderRecommendation } from '../../types';

interface ReorderAdvisorWidgetProps {
  recommendations: ReorderRecommendation[];
  onOpenReceiptModal?: (productId: string, quantity: number) => void;
}

export const ReorderAdvisorWidget: React.FC<ReorderAdvisorWidgetProps> = ({
  recommendations,
  onOpenReceiptModal,
}) => {
  const [selectedWhy, setSelectedWhy] = useState<ReorderRecommendation | null>(null);
  const navigate = useNavigate();

  const activeReorders = recommendations.filter(
    (r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'AT_RISK' || r.riskLevel === 'WATCH'
  );

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Smart Reorder Advisor
              </h3>
              <p className="text-xs text-slate-400">
                Transparent rule-based replenishment calculations
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/intelligence')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>View All ({recommendations.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Reorder Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                <th className="pb-2 font-semibold">Product</th>
                <th className="pb-2 font-semibold text-center">Stock</th>
                <th className="pb-2 font-semibold text-center">Reorder Pt</th>
                <th className="pb-2 font-semibold text-center">Recommended</th>
                <th className="pb-2 font-semibold text-center">Risk Level</th>
                <th className="pb-2 font-semibold text-right">Explain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {activeReorders.slice(0, 5).map((item) => (
                <tr
                  key={item.productId}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.productName}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">{item.sku}</div>
                  </td>
                  <td className="py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                    {item.currentStock}
                  </td>
                  <td className="py-3 text-center text-slate-500 font-medium">
                    {item.reorderPoint}
                  </td>
                  <td className="py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    +{item.recommendedOrderQuantity} units
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                        item.riskLevel === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : item.riskLevel === 'AT_RISK'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {item.riskLevel.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => setSelectedWhy(item)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition-colors"
                    >
                      Why?
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* "Why?" Explanation Modal */}
      {selectedWhy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Reorder Calculation: {selectedWhy.productName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedWhy.sku}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWhy(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs & Variables Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-medium">Current Stock</span>
                <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedWhy.currentStock}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-medium">Avg Daily Usage</span>
                <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedWhy.avgDailyUsage}/day
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-medium">Supplier Lead Time</span>
                <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedWhy.leadTimeDays} days
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-medium">Safety Stock</span>
                <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedWhy.safetyStock}
                </div>
              </div>
            </div>

            {/* Mathematical Formula Explanation */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-1.5 shadow-inner">
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                Transparent Formula Execution
              </div>
              <div className="text-slate-200 leading-relaxed font-semibold">
                {selectedWhy.calculationFormula}
              </div>
            </div>

            {/* Recommendation Reasoning */}
            <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60 space-y-1">
              <div className="text-xs font-bold text-brand-900 dark:text-brand-300">
                Advisor Recommendation:
              </div>
              <p className="text-xs text-brand-800 dark:text-brand-400 leading-relaxed">
                {selectedWhy.reason}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setSelectedWhy(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedWhy(null);
                  navigate(`/receipts?supplier=${selectedWhy.preferredSupplier?.id || ''}`);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Purchase Receipt (+{selectedWhy.recommendedOrderQuantity})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
