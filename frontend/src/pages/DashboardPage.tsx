import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Layers,
  DollarSign,
  AlertTriangle,
  TrendingDown,
  Inbox,
  Truck,
  ArrowRightLeft,
  Activity,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import api from '../api/client';
import { DailyBriefBanner } from '../components/dashboard/DailyBriefBanner';
import { HealthScoreWidget } from '../components/dashboard/HealthScoreWidget';
import { StockRiskRadar } from '../components/dashboard/StockRiskRadar';
import { ReorderAdvisorWidget } from '../components/dashboard/ReorderAdvisorWidget';
import { DigitalTwinGrid } from '../components/warehouses/DigitalTwinGrid';

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [movementChartData, setMovementChartData] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, moveRes, reorderRes, whRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/reports/movements?days=14'),
        api.get('/intelligence/reorder'),
        api.get('/warehouses'),
      ]);

      if (dashRes.data?.success) setDashboardData(dashRes.data.data);
      if (moveRes.data?.success) setMovementChartData(moveRes.data.data.movementTimeline || []);
      if (reorderRes.data?.success) setRecommendations(reorderRes.data.data.recommendations || []);
      if (whRes.data?.success) setWarehouses(whRes.data.data.warehouses || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !dashboardData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  const kpis = dashboardData?.kpis || {
    totalProducts: 21,
    totalUnits: 1420,
    totalValuation: 86450,
    lowStockCount: 4,
    outOfStockCount: 1,
    pendingReceipts: 2,
    pendingDeliveries: 3,
    activeTransfers: 1,
  };

  const kpiCards = [
    {
      label: 'Total Products',
      value: kpis.totalProducts,
      sublabel: 'Active SKUs',
      icon: Package,
      color: 'blue',
      onClick: () => navigate('/products'),
    },
    {
      label: 'Total Units',
      value: Number(kpis.totalUnits).toLocaleString(),
      sublabel: 'Across 3 warehouses',
      icon: Layers,
      color: 'indigo',
      onClick: () => navigate('/warehouses'),
    },
    {
      label: 'Stock Valuation',
      value: `$${Number(kpis.totalValuation).toLocaleString()}`,
      sublabel: 'Asset cost valuation',
      icon: DollarSign,
      color: 'emerald',
      onClick: () => navigate('/reports'),
    },
    {
      label: 'Low Stock Risk',
      value: kpis.lowStockCount,
      sublabel: 'Below reorder point',
      icon: AlertTriangle,
      color: 'amber',
      onClick: () => navigate('/products?status=LOW_STOCK'),
    },
    {
      label: 'Out of Stock',
      value: kpis.outOfStockCount,
      sublabel: 'Zero available units',
      icon: TrendingDown,
      color: 'rose',
      onClick: () => navigate('/products?status=OUT_OF_STOCK'),
    },
    {
      label: 'Pending Receipts',
      value: kpis.pendingReceipts,
      sublabel: 'Inbound dock queue',
      icon: Inbox,
      color: 'emerald',
      onClick: () => navigate('/receipts?status=READY'),
    },
    {
      label: 'Pending Deliveries',
      value: kpis.pendingDeliveries,
      sublabel: 'Customer dispatch',
      icon: Truck,
      color: 'blue',
      onClick: () => navigate('/deliveries?status=WAITING'),
    },
    {
      label: 'Scheduled Transfers',
      value: kpis.activeTransfers,
      sublabel: 'Internal rack flux',
      icon: ArrowRightLeft,
      color: 'purple',
      onClick: () => navigate('/transfers'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Inventory Command Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time stock operations, decision intelligence, and automated ledger tracking
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Data</span>
        </button>
      </div>

      {/* 1. Today's Operational Inventory Summary & Action Required Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Action Required (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Action Required
              </h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              3 Items Flagged
            </span>
          </div>

          <div className="space-y-2.5">
            {(dashboardData?.actionRequired || [
              {
                id: '1',
                title: 'Steel Rods (High-Tensile 12mm)',
                subtitle: 'Projected stockout in 18 days at current demand velocity (8.4 kg/day).',
                actionLabel: 'View Forecast',
                linkUrl: '/forecast',
                severity: 'WARNING',
              },
              {
                id: '2',
                title: 'Copper Wire Spools 2.5mm',
                subtitle: 'Demand velocity increased +27% over baseline usage period.',
                actionLabel: 'View Product',
                linkUrl: '/products?search=SKU-COP-006',
                severity: 'INFO',
              },
              {
                id: '3',
                title: 'Epoxy Floor Paint Buckets 20L',
                subtitle: 'No outbound movement recorded for past 74 days.',
                actionLabel: 'Review Item',
                linkUrl: '/products?search=SKU-PNT-008',
                severity: 'MUTED',
              },
            ]).map((item: any) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>{item.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-3.5">
                    {item.subtitle}
                  </div>
                </div>
                <button
                  onClick={() => navigate(item.linkUrl)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shrink-0 shadow-2xs"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Operational Summary (1 col) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle flex flex-col justify-between space-y-3.5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Today&apos;s Inventory Summary</span>
            </h2>
            <p className="text-[11px] text-slate-400">Current operational bottlenecks & queues</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/30">
              <span className="text-slate-600 dark:text-slate-300">Products needing attention</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {(kpis.lowStockCount || 0) + (kpis.outOfStockCount || 0)} items
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/30">
              <span className="text-slate-600 dark:text-slate-300">Pending inbound receipts</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {kpis.pendingReceipts || 0} shipments
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/30">
              <span className="text-slate-600 dark:text-slate-300">Pending delivery orders</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {kpis.pendingDeliveries || 0} orders
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/30">
              <span className="text-slate-600 dark:text-slate-300">Approaching reorder point</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {kpis.lowStockCount || 0} products
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/forecast')}
            className="w-full py-2 text-xs font-semibold text-center text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-xl transition-colors shadow-2xs"
          >
            Review 30-Day Forecast ➔
          </button>
        </div>
      </div>

      {/* 2. Smart Daily Brief Banner */}
      <DailyBriefBanner data={dashboardData?.dailyBrief} />

      {/* 3. 8 KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              onClick={kpi.onClick}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle hover:shadow-card hover:border-brand-500/50 cursor-pointer transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">{kpi.label}</span>
                <div
                  className={`p-1.5 rounded-lg ${
                    kpi.color === 'emerald'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                      : kpi.color === 'amber'
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                      : kpi.color === 'rose'
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                      : kpi.color === 'purple'
                      ? 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{kpi.sublabel}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Primary Intelligence Layer: Health Score + Stock Risk Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HealthScoreWidget
          data={dashboardData?.healthScore}
          onExplore={() => navigate('/intelligence')}
        />
        <StockRiskRadar data={dashboardData?.riskRadar} />
      </div>

      {/* 4. Secondary Row: Stock Movement Velocity Chart + Smart Reorder Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movement Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Stock Movement Velocity
                </h3>
                <p className="text-xs text-slate-400">14-Day Inbound Receipts vs Outbound Deliveries</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/ledger')}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <span>Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            {movementChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No movements recorded in the last 14 days.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={movementChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="receiptsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="delivGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="receipts"
                    name="Receipts (+)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#receiptsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="deliveries"
                    name="Deliveries (-)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#delivGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Smart Reorder Advisor Widget */}
        <ReorderAdvisorWidget recommendations={recommendations} />
      </div>

      {/* 5. Interactive Digital Twin 2D Warehouse Representation */}
      <DigitalTwinGrid
        warehouses={warehouses}
        onSelectProduct={(sku) => navigate(`/products?search=${sku}`)}
      />

      {/* 6. Recent Stock Ledger Audit Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Recent Stock Ledger Operations
              </h3>
              <p className="text-xs text-slate-400">Continuous audit-grade immutable transaction stream</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/ledger')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(dashboardData?.recentLedger || []).map((entry: any) => (
            <div
              key={entry.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-xl transition-colors"
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
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {entry.product?.name}
                  </span>
                  <span className="text-slate-400 font-mono ml-2">({entry.sku})</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {entry.reason || 'Inventory movement'} • Ref: <span className="font-mono">{entry.referenceDoc || entry.transactionNumber}</span>
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
                    {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity} {entry.product?.unitOfMeasure}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Stock: {entry.beforeStock} → {entry.afterStock}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
