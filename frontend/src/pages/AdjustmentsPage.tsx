import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Warehouse,
  X,
  Calculator,
} from 'lucide-react';
import api from '../api/client';
import { Adjustment, Warehouse as WarehouseType, Product } from '../types';
import { useToast } from '../context/ToastContext';

export const AdjustmentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    locationId: '',
    physicalQuantity: 0,
    systemQuantity: 0,
    reason: '',
    category: 'COUNT_ERROR',
    notes: '',
  });

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const [adjRes, whRes, prodRes] = await Promise.all([
        api.get('/adjustments'),
        api.get('/warehouses'),
        api.get('/products'),
      ]);

      if (adjRes.data?.success) setAdjustments(adjRes.data.data.items);
      if (whRes.data?.success) setWarehouses(whRes.data.data.warehouses);
      if (prodRes.data?.success) setProducts(prodRes.data.data.items);
    } catch (err) {
      console.error('Failed to load adjustments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const handleProductChange = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      const defaultLoc = prod.defaultLocationId;
      const defaultWh = prod.defaultLocation?.warehouse?.name ? warehouses.find(w => w.locations.some(l => l.id === defaultLoc))?.id : warehouses[0]?.id;
      
      const locStock = prod.stocks?.find((s) => s.locationId === defaultLoc)?.quantity || prod.currentStock || 0;

      setFormData({
        ...formData,
        productId,
        warehouseId: defaultWh || warehouses[0]?.id || '',
        locationId: defaultLoc || warehouses[0]?.locations[0]?.id || '',
        systemQuantity: locStock,
        physicalQuantity: locStock,
      });
    }
  };

  const difference = formData.physicalQuantity - formData.systemQuantity;

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      showToast({ type: 'warning', message: 'A valid reason is strictly mandatory for stock adjustments.' });
      return;
    }

    try {
      const res = await api.post('/adjustments', {
        ...formData,
        physicalQuantity: Number(formData.physicalQuantity),
      });

      if (res.data?.success) {
        showToast({
          type: 'success',
          title: 'Adjustment Confirmed',
          message: `${res.data.data.adjustment.adjustmentNumber} logged. Variance: ${difference >= 0 ? '+' : ''}${difference} units.`,
        });
        setIsCreateOpen(false);
        fetchAdjustments();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Adjustment Failed',
        message: err.response?.data?.error?.message || 'Failed to record adjustment',
      });
    }
  };

  const selectedWarehouse = warehouses.find((w) => w.id === formData.warehouseId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Inventory Adjustments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Physical count reconciliation vs recorded system quantity with mandatory audit reasoning
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Record Physical Adjustment</span>
        </button>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Adjustment #</th>
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold text-center">System Qty</th>
                <th className="py-3 px-4 font-semibold text-center">Physical Count</th>
                <th className="py-3 px-4 font-semibold text-center">Variance Difference</th>
                <th className="py-3 px-4 font-semibold">Category / Reason</th>
                <th className="py-3 px-4 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No physical count adjustments recorded yet.
                  </td>
                </tr>
              ) : (
                adjustments.map((adj) => (
                  <tr
                    key={adj.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-slate-100">
                      {adj.adjustmentNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {adj.product?.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{adj.product?.sku}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {adj.warehouse?.name} - {adj.location?.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-500">
                      {adj.systemQuantity} {adj.product?.unitOfMeasure}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-slate-100">
                      {adj.physicalQuantity} {adj.product?.unitOfMeasure}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          adj.difference > 0
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : adj.difference < 0
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {adj.difference >= 0 ? `+${adj.difference}` : adj.difference} {adj.product?.unitOfMeasure}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 mr-1.5">
                        {adj.category}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">{adj.reason}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {new Date(adj.adjustmentDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Adjustment Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-600" />
                <span>Record Physical Inventory Count Adjustment</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Product *</label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - System Total: {p.currentStock} {p.unitOfMeasure}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Warehouse *</label>
                  <select
                    required
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value, locationId: '' })}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location / Rack *</label>
                  <select
                    required
                    disabled={!formData.warehouseId}
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                  >
                    <option value="">Select Rack</option>
                    {selectedWarehouse?.locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Automatic Difference Calculation Box */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase">System Quantity</label>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                    {formData.systemQuantity}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Physical Count *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.physicalQuantity}
                    onChange={(e) => setFormData({ ...formData, physicalQuantity: parseFloat(e.target.value) || 0 })}
                    className="w-full p-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Difference</label>
                  <div
                    className={`text-sm font-black font-mono mt-1 ${
                      difference > 0 ? 'text-emerald-600' : difference < 0 ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    {difference >= 0 ? `+${difference}` : difference}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Variance Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="COUNT_ERROR">Physical Count Recount</option>
                    <option value="DAMAGED">Damaged in Handling</option>
                    <option value="LOST">Lost / Missing</option>
                    <option value="EXPIRED">Expired / Quality Reject</option>
                    <option value="FOUND">Surplus Found</option>
                    <option value="DEMO">Customer Demo Sample</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mandatory Justification Reason *</label>
                  <input
                    type="text"
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g. 3 kg damaged during bending inspection"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-sm"
                >
                  Confirm Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
