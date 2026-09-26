import React, { useState, useEffect } from 'react';
import {
  Activity,
  Download,
  Search,
  Filter,
  Calendar,
  Layers,
  ArrowRight,
  User,
  Inbox,
  Truck,
  ArrowRightLeft,
  Sliders,
} from 'lucide-react';
import api from '../api/client';
import { StockLedgerEntry, Product } from '../types';
import { useToast } from '../context/ToastContext';

export const LedgerPage: React.FC = () => {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<StockLedgerEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState('ALL');

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (selectedProduct !== 'ALL') params.productId = selectedProduct;

      const [ledgRes, prodRes] = await Promise.all([
        api.get('/ledger', { params }),
        api.get('/products'),
      ]);

      if (ledgRes.data?.success) setEntries(ledgRes.data.data.items);
      if (prodRes.data?.success) setProducts(prodRes.data.data.items);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [search, typeFilter, selectedProduct]);

  const handleExportCsv = () => {
    const url = `/api/ledger/export?type=${typeFilter}&productId=${selectedProduct}`;
    window.open(url, '_blank');
    showToast({
      type: 'success',
      title: 'CSV Export Initiated',
      message: 'Stock ledger audit log is downloading as CSV.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Immutable Stock Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Complete continuous transaction ledger with before/after baselines and audit justifications
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors"
        >
          <Download className="w-4 h-4 text-brand-600" />
          <span>Export Ledger to CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by transaction ID, SKU, product name, or reference doc..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="RECEIPT">Receipts (+)</option>
            <option value="DELIVERY">Deliveries (-)</option>
            <option value="TRANSFER_IN">Internal Transfers (±0)</option>
            <option value="ADJUSTMENT">Adjustments (±)</option>
          </select>

          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none max-w-[180px] truncate"
          >
            <option value="ALL">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp / TXN ID</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Product & SKU</th>
                <th className="py-3 px-4 font-semibold">Source / Destination</th>
                <th className="py-3 px-4 font-semibold text-center">Quantity Flux</th>
                <th className="py-3 px-4 font-semibold text-center">Stock Baseline (Before → After)</th>
                <th className="py-3 px-4 font-semibold">Reference & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No ledger transactions matching your filter criteria.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-slate-900 dark:text-slate-100 font-bold text-[11px]">
                        {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-slate-400">{entry.transactionNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 font-mono font-bold text-[10px] rounded uppercase ${
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
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {entry.product?.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{entry.sku}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {entry.sourceLocation && (
                        <div>From: <span className="font-semibold text-slate-700 dark:text-slate-300">{entry.sourceLocation.name}</span></div>
                      )}
                      {entry.destLocation && (
                        <div>To: <span className="font-semibold text-slate-700 dark:text-slate-300">{entry.destLocation.name}</span></div>
                      )}
                      {!entry.sourceLocation && !entry.destLocation && 'Global Intake'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-mono font-bold text-xs ${
                          entry.quantity > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : entry.quantity < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity} {entry.product?.unitOfMeasure}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="text-slate-500">{entry.beforeStock}</span>
                      <span className="text-slate-400 mx-1.5">→</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{entry.afterStock}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                        {entry.referenceDoc || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {entry.reason || 'Routine operation'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
