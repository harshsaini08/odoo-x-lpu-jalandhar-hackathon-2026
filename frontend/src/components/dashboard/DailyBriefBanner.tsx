import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  AlertTriangle,
  Inbox,
  Truck,
  ArrowRightLeft,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

interface DailyBriefProps {
  data?: {
    greeting: string;
    briefMessage: string;
    counters: {
      productsNeedingAttention: number;
      pendingReceipts: number;
      pendingDeliveries: number;
      scheduledTransfers: number;
      stockoutRiskProducts: number;
    };
    topActions: Array<{
      id: string;
      title: string;
      description: string;
      actionType: string;
      priority: string;
      linkUrl: string;
    }>;
  } | null;
}

export const DailyBriefBanner: React.FC<DailyBriefProps> = ({ data }) => {
  const navigate = useNavigate();

  const counters = data?.counters || {
    productsNeedingAttention: 4,
    pendingReceipts: 2,
    pendingDeliveries: 3,
    scheduledTransfers: 1,
    stockoutRiskProducts: 1,
  };

  const topActions = data?.topActions || [
    {
      id: '1',
      title: 'Reorder Steel Rods (SKU-STL-001)',
      description: 'Stock at 42 kg (below 50 kg reorder threshold). Lead time is 5 days.',
      actionType: 'REORDER',
      priority: 'HIGH',
      linkUrl: '/products?search=Steel',
    },
    {
      id: '2',
      title: 'Validate Inbound Receipt REC-2026-089',
      description: '100 units waiting at receiving dock bay 1.',
      actionType: 'RECEIPT',
      priority: 'MEDIUM',
      linkUrl: '/receipts',
    },
    {
      id: '3',
      title: 'Fulfill Delivery DEL-2026-104 for Apex Fabrication',
      description: 'Scheduled dispatch queued for today.',
      actionType: 'DELIVERY',
      priority: 'MEDIUM',
      linkUrl: '/deliveries',
    },
  ];

  return (
    <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white shadow-xl border border-slate-800 relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
                STOCKSENSE DAILY INTELLIGENCE BRIEF
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {data?.greeting || 'GOOD MORNING, INVENTORY MANAGER'}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {data?.briefMessage ||
                "Today's stock overview: 4 products require attention, 2 inbound receipts ready for dock intake, and 3 customer deliveries scheduled for dispatch."}
            </p>
          </div>

          {/* KPI Mini Badges */}
          <div className="flex flex-wrap gap-2 sm:self-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300 font-medium">Attention:</span>
              <span className="font-bold text-amber-400">{counters.productsNeedingAttention}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
              <Inbox className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300 font-medium">Receipts:</span>
              <span className="font-bold text-emerald-400">{counters.pendingReceipts}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-300 font-medium">Deliveries:</span>
              <span className="font-bold text-blue-400">{counters.pendingDeliveries}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-slate-300 font-medium">Stockout Risk:</span>
              <span className="font-bold text-rose-400">{counters.stockoutRiskProducts}</span>
            </div>
          </div>
        </div>

        {/* Priority Actions List */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span>PRIORITIZED OPERATIONAL ACTIONS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topActions.map((action, idx) => (
              <div
                key={action.id}
                onClick={() => navigate(action.linkUrl)}
                className="group p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-emerald-500/50 cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-2 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-700/80 text-slate-300 uppercase">
                      Action #{idx + 1}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        action.priority === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {action.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {action.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold pt-1">
                  <span>Execute Now</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
