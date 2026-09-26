import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Layers,
  AlertTriangle,
  HelpCircle,
  ShoppingCart,
  ChevronDown,
  Info,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../api/client';
import { DemandForecastResult, Product } from '../types';
import { useToast } from '../context/ToastContext';

interface DemandForecastPageProps {
  onPrepareReorder?: (prefill: {
    productId: string;
    productName: string;
    supplierId?: string;
    warehouseId?: string;
    quantity: number;
  }) => void;
}

export const DemandForecastPage: React.FC<DemandForecastPageProps> = ({ onPrepareReorder }) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const [forecast, setForecast] = useState<DemandForecastResult | null>(null);
  const [allSummaries, setAllSummaries] = useState<DemandForecastResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  // 1. Fetch initial product list & all forecast summaries
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setIsLoading(true);
        const [prodsRes, summariesRes] = await Promise.all([
          api.get('/products?limit=100'),
          api.get('/forecast/summaries'),
        ]);

        const prodList = prodsRes.data.data.items || [];
        setProducts(prodList);
        setAllSummaries(summariesRes.data.data.forecasts || []);

        // Default to Steel Rods if found, otherwise first product
        const steel = prodList.find((p: Product) => p.sku === 'SKU-STL-001' || p.name.includes('Steel'));
        if (steel) {
          setSelectedProductId(steel.id);
        } else if (prodList.length > 0) {
          setSelectedProductId(prodList[0].id);
        }
      } catch (err: any) {
        showToast({ type: 'error', title: 'Failed to load forecast data', message: err.message });
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitial();
  }, []);

  // 2. Fetch specific product forecast whenever selectedProductId or horizonDays changes
  useEffect(() => {
    if (!selectedProductId) return;

    const fetchProductForecast = async () => {
      try {
        const res = await api.get(`/forecast/product/${selectedProductId}?horizonDays=${horizonDays}`);
        setForecast(res.data.data.forecast);
      } catch (err: any) {
        showToast({ type: 'error', title: 'Forecast retrieval error', message: err.message });
      }
    };
    fetchProductForecast();
  }, [selectedProductId, horizonDays]);

  // Combine historical and future timeline for the chart
  const combinedChartData = React.useMemo(() => {
    if (!forecast) return [];

    const historyPoints = (forecast.historicalTimeline || []).map((h) => ({
      name: h.dayLabel,
      type: 'Historical',
      'Actual Demand': h.actualDemand,
      'Projected Demand': null,
      'Stock Level': h.stockLevel,
      'Upper Bound': null,
      'Lower Bound': null,
    }));

    // Connect last history point to forecast
    const lastHistStock = historyPoints[historyPoints.length - 1]?.['Stock Level'] || forecast.currentStock;

    const forecastPoints = (forecast.forecastTimeline || []).map((f) => ({
      name: f.dayLabel,
      type: 'Forecast',
      'Actual Demand': null,
      'Projected Demand': f.projectedDemand,
      'Stock Level': f.projectedStock,
      'Upper Bound': f.upperBound,
      'Lower Bound': f.lowerBound,
    }));

    return [...historyPoints, ...forecastPoints];
  }, [forecast]);

  const handlePrepareReorderClick = () => {
    if (!forecast) return;
    if (onPrepareReorder) {
      onPrepareReorder({
        productId: forecast.productId,
        productName: forecast.productName,
        supplierId: forecast.preferredSupplier?.id,
        warehouseId: forecast.defaultLocation?.warehouseId,
        quantity: forecast.recommendedReorderQty,
      });
      showToast({
        type: 'info',
        title: 'Reorder Prepared',
        message: `Opening Receipt intake for ${forecast.recommendedReorderQty} ${forecast.unitOfMeasure} of ${forecast.productName}.`,
      });
    } else {
      window.location.href = `/receipts?prefillProduct=${forecast.productId}&prefillQty=${forecast.recommendedReorderQty}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Page Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Demand Forecast
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              Deterministic Math
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explainable consumption projections based on 90-day outbound movement, stock velocity, and lead times.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Product Dropdown */}
          <div className="relative min-w-[220px]">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2 text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none text-slate-800 dark:text-slate-200"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Horizon Selector */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setHorizonDays(d)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  horizonDays === d
                    ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>

          {/* Prepare Reorder Button */}
          <button
            onClick={handlePrepareReorderClick}
            disabled={!forecast || forecast.recommendedReorderQty <= 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Prepare Reorder ({forecast?.recommendedReorderQty || 0} {forecast?.unitOfMeasure})</span>
          </button>
        </div>
      </div>

      {isLoading || !forecast ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Computing time-series forecast models...</p>
        </div>
      ) : (
        <>
          {/* Low Data Warning (if applicable) */}
          {forecast.isLowData && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Limited historical data:</strong> Only {forecast.historicalDays} days of movement recorded for this item. Forecast confidence is low; estimates rely on baseline velocity.
              </span>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {/* Current Stock */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Current Stock
              </div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {forecast.currentStock}{' '}
                <span className="text-xs font-normal text-slate-500">{forecast.unitOfMeasure}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Real-time DB balance</div>
            </div>

            {/* Average Daily Demand */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Avg Daily Demand
              </div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {forecast.avgDailyDemand}{' '}
                <span className="text-xs font-normal text-slate-500">{forecast.unitOfMeasure}/d</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] mt-0.5">
                {forecast.trendDirection === 'INCREASING' ? (
                  <span className="text-emerald-600 font-semibold flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" /> +{forecast.trendPercentage}%
                  </span>
                ) : forecast.trendDirection === 'DECREASING' ? (
                  <span className="text-rose-600 font-semibold flex items-center">
                    <TrendingDown className="w-3 h-3 mr-0.5" /> {forecast.trendPercentage}%
                  </span>
                ) : (
                  <span className="text-slate-500 font-medium">Stable usage</span>
                )}
              </div>
            </div>

            {/* Projected Demand */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {horizonDays}-Day Forecast
              </div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {horizonDays === 30
                  ? forecast.projected30dDemand
                  : horizonDays === 60
                  ? forecast.projected60dDemand
                  : forecast.projected90dDemand}{' '}
                <span className="text-xs font-normal text-slate-500">{forecast.unitOfMeasure}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Expected consumption</div>
            </div>

            {/* Expected Stockout */}
            <div className={`p-3.5 rounded-xl border shadow-sm ${
              forecast.expectedStockoutDays <= forecast.supplierLeadTime
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                : forecast.expectedStockoutDays <= 30
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}>
              <div className="text-[11px] font-medium uppercase tracking-wider opacity-80">
                Expected Stockout
              </div>
              <div className="text-lg sm:text-xl font-bold mt-1">
                {forecast.expectedStockoutDays >= 365 ? '365+ days' : `${forecast.expectedStockoutDays} days`}
              </div>
              <div className="text-[10px] opacity-75 mt-0.5">
                {forecast.expectedStockoutDate ? `Depletes ~${forecast.expectedStockoutDate}` : 'Safe runway'}
              </div>
            </div>

            {/* Supplier Lead Time */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Supplier Lead Time
              </div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {forecast.supplierLeadTime} <span className="text-xs font-normal text-slate-500">days</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {forecast.preferredSupplier?.name || 'Default Supplier'}
              </div>
            </div>

            {/* Recommended Reorder */}
            <div className="p-3.5 rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 shadow-sm">
              <div className="text-[11px] font-medium text-brand-800 dark:text-brand-300 uppercase tracking-wider">
                Recommended Order
              </div>
              <div className="text-lg sm:text-xl font-bold text-brand-900 dark:text-brand-100 mt-1">
                {forecast.recommendedReorderQty}{' '}
                <span className="text-xs font-normal text-brand-700 dark:text-brand-300">{forecast.unitOfMeasure}</span>
              </div>
              <div className="text-[10px] text-brand-600 dark:text-brand-400 mt-0.5">
                Replenish to max ({forecast.reorderPoint} ROP)
              </div>
            </div>

            {/* Forecast Confidence */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Confidence
              </div>
              <div className="mt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg ${
                  forecast.forecastConfidence === 'HIGH'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : forecast.forecastConfidence === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {forecast.forecastConfidence}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{forecast.historicalDays}d history length</div>
            </div>
          </div>

          {/* Main Chart Section: Historical vs Forecast Demand */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Historical vs Projected Demand & Stock Depletion</span>
                  <button
                    onClick={() => setShowFormulaModal(!showFormulaModal)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title="View mathematical formula breakdown"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Solid purple line depicts past 90-day recorded shipments; dashed emerald line projects forward {horizonDays} days with 95% confidence intervals.
                </p>
              </div>

              {/* Legend Badges */}
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-indigo-500 rounded" />
                  <span>Historical Demand</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-500 border-t border-dashed border-emerald-500" />
                  <span>Forecast Demand</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-500 rounded" />
                  <span>Projected Stock</span>
                </div>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  {/* Historical Demand Area */}
                  <Area
                    type="monotone"
                    dataKey="Actual Demand"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="#6366f1"
                    fillOpacity={0.15}
                  />
                  {/* Forecast Projected Demand Line */}
                  <Line
                    type="monotone"
                    dataKey="Projected Demand"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#10b981' }}
                  />
                  {/* Stock Level Trajectory */}
                  <Line
                    type="monotone"
                    dataKey="Stock Level"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Explainable Rationale Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 text-white border border-slate-800 shadow-md">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>How was this forecast calculated?</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                    Formula Verified
                  </span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {forecast.explanation}
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-slate-400 border-t border-slate-800/80 mt-2">
                  <div>
                    Safety Stock = <span className="text-white font-mono">{forecast.safetyStock} {forecast.unitOfMeasure}</span>
                  </div>
                  <div>
                    Reorder Threshold = <span className="text-white font-mono">{forecast.reorderPoint} {forecast.unitOfMeasure}</span>
                  </div>
                  <div>
                    Daily Burn Rate = <span className="text-white font-mono">{forecast.projectedDailyDemand} {forecast.unitOfMeasure}/day</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Catalog All-Products Forecast Matrix Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Catalog Replenishment Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quick summary of all tracked items sorted by stockout runway.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Current Stock</th>
                    <th className="py-2.5 px-3">Avg Daily Demand</th>
                    <th className="py-2.5 px-3">30d Forecast</th>
                    <th className="py-2.5 px-3">Stockout Runway</th>
                    <th className="py-2.5 px-3">Recommended Reorder</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allSummaries.map((item) => {
                    const isCurrent = item.productId === selectedProductId;
                    const isUrgent = item.expectedStockoutDays <= 20;

                    return (
                      <tr
                        key={item.productId}
                        onClick={() => setSelectedProductId(item.productId)}
                        className={`cursor-pointer transition-colors ${
                          isCurrent
                            ? 'bg-brand-50/50 dark:bg-brand-950/30 font-medium'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{item.productName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{item.category}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {item.currentStock} {item.unitOfMeasure}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {item.avgDailyDemand} {item.unitOfMeasure}/d
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {item.projected30dDemand} {item.unitOfMeasure}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.expectedStockoutDays <= 10
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : item.expectedStockoutDays <= 25
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {item.expectedStockoutDays >= 365 ? 'Safe (365d+)' : `${item.expectedStockoutDays} days`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-brand-600 dark:text-brand-400">
                          {item.recommendedReorderQty > 0 ? `${item.recommendedReorderQty} ${item.unitOfMeasure}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProductId(item.productId);
                            }}
                            className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
