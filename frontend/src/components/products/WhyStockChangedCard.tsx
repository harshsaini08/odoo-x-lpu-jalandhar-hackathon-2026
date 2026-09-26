import React from 'react';
import {
  Activity,
  Inbox,
  Truck,
  Sliders,
  ArrowRightLeft,
  Calendar,
  User,
  ArrowUpRight,
  Calculator,
} from 'lucide-react';
import { StockExplanation } from '../../types';

interface WhyStockChangedCardProps {
  explanation: StockExplanation | null;
}

export const WhyStockChangedCard: React.FC<WhyStockChangedCardProps> = ({ explanation }) => {
  if (!explanation) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-sm">
        Select a product to view the automated Stock Explanation reconciliation.
      </div>
    );
  }

  const { product, summary, breakdownItems, recentMovements } = explanation;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Why Did Stock Change?
              </h3>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Automated Reconciliation
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Audit-grade immutable mathematical reconciliation for {product.name} ({product.sku})
            </p>
          </div>
        </div>

        {/* Current Stock Banner */}
        <div className="text-right">
          <span className="text-xs text-slate-400 font-medium">Recorded System Balance</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {product.currentStock} <span className="text-sm font-semibold text-slate-400">{product.unitOfMeasure}</span>
          </div>
        </div>
      </div>

      {/* Formula Summary Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs shadow-inner space-y-2">
        <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          <span>Continuous Stock Balance Equation</span>
        </div>
        <div className="text-slate-200 font-semibold leading-relaxed">
          {summary.formula}
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {breakdownItems.map((item) => {
          const isReceipt = item.type === 'RECEIPTS';
          const isDelivery = item.type === 'DELIVERIES';
          const isAdjustment = item.type === 'ADJUSTMENTS';
          const isTransfer = item.type === 'TRANSFERS';

          const Icon = isReceipt ? Inbox : isDelivery ? Truck : isAdjustment ? Sliders : ArrowRightLeft;

          return (
            <div
              key={item.type}
              className={`p-4 rounded-2xl border transition-all ${
                isReceipt
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-200'
                  : isDelivery
                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-800/40 text-rose-950 dark:text-rose-200'
                  : isAdjustment
                  ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/40 text-amber-950 dark:text-amber-200'
                  : 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/40 text-blue-950 dark:text-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-xs">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-black tracking-tight">{item.displayQty}</span>
              </div>
              <div className="font-bold text-xs">{item.label}</div>
              <div className="text-[11px] opacity-75 mt-0.5">{item.description}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Ledger Audit Trail */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <span>Recent Ledger Movements Audit Log</span>
          <span className="text-[11px] font-normal text-slate-400">Showing last 8 operations</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
          {recentMovements.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No recent movements logged for this product.
            </div>
          ) : (
            recentMovements.map((entry) => (
              <div
                key={entry.id}
                className="p-3.5 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 font-mono font-bold text-[10px] rounded uppercase ${
                      entry.type === 'RECEIPT'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : entry.type === 'DELIVERY'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : entry.type === 'ADJUSTMENT'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {entry.type}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {entry.reason || 'Inventory Transaction'}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{entry.referenceDoc || entry.transactionNumber}</span>
                      <span>•</span>
                      <span>{new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div
                      className={`font-mono font-bold ${
                        entry.quantity > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : entry.quantity < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity} {product.unitOfMeasure}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Stock: {entry.beforeStock} → {entry.afterStock}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
