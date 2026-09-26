import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  DollarSign,
  Layers,
  PieChart as PieChartIcon,
  Activity,
  Warehouse,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export const ReportsPage: React.FC = () => {
  const { showToast } = useToast();
  const [summaryData, setSummaryData] = useState<any>(null);
  const [warehouseReport, setWarehouseReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [sumRes, whRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/reports/utilization'),
      ]);

      if (sumRes.data?.success) setSummaryData(sumRes.data.data);
      if (whRes.data?.success) setWarehouseReport(whRes.data.data.warehouses);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCsv = () => {
    window.open('/api/ledger/export', '_blank');
    showToast({
      type: 'success',
      title: 'Report Export Initiated',
      message: 'Downloading comprehensive inventory report as CSV.',
    });
  };

  const summary = summaryData?.summary || {
    totalProducts: 21,
    totalUnits: 1420,
    totalValuation: 86450,
    totalRetailValue: 139200,
    potentialGrossProfit: 52750,
    averageUnitCost: 60.88,
  };

  const categoryBreakdown = summaryData?.categoryBreakdown || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Inventory Analytics & Financial Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Valuation, category asset allocations, gross margin potential, and facility utilization
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Export Full CSV Audit</span>
        </button>
      </div>

      {/* Financial Valuation KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Inventory Asset Valuation</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ${Number(summary.totalValuation).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Based on average unit cost ${summary.averageUnitCost?.toFixed(2)}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-1">
          <span className="text-xs text-slate-400 font-medium">Estimated Retail Market Value</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            ${Number(summary.totalRetailValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Projected gross realization value
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-1">
          <span className="text-xs text-slate-400 font-medium">Potential Gross Margin</span>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            ${Number(summary.potentialGrossProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {summary.totalRetailValue > 0 ? ((summary.potentialGrossProfit / summary.totalRetailValue) * 100).toFixed(1) : 0}% Gross Margin
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-1">
          <span className="text-xs text-slate-400 font-medium">Catalog Depth & Total Units</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {summary.totalUnits} <span className="text-sm font-semibold text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Across {summary.totalProducts} active product SKUs
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Valuation Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Asset Allocation by Category
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="valuation"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categoryBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Valuation']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Warehouse Utilization Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Facility Space Utilization
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={warehouseReport} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="code" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    name === 'usedCapacity' ? `${val} units` : `$${val.toLocaleString()}`,
                    name === 'usedCapacity' ? 'Stock Units' : 'Asset Value',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="usedCapacity" name="Stock Units" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
