import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Warehouse,
  ArrowRight,
  Eye,
  X,
  Trash2,
} from 'lucide-react';
import api from '../api/client';
import { Transfer, Warehouse as WarehouseType, Product } from '../types';
import { useToast } from '../context/ToastContext';

export const TransfersPage: React.FC = () => {
  const { showToast } = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    sourceWarehouseId: '',
    sourceLocationId: '',
    destWarehouseId: '',
    destLocationId: '',
    notes: '',
    items: [{ productId: '', quantity: 10 }],
  });

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const [trfRes, whRes, prodRes] = await Promise.all([
        api.get('/transfers', { params }),
        api.get('/warehouses'),
        api.get('/products'),
      ]);

      if (trfRes.data?.success) setTransfers(trfRes.data.data.items);
      if (whRes.data?.success) setWarehouses(whRes.data.data.warehouses);
      if (prodRes.data?.success) setProducts(prodRes.data.data.items);
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [statusFilter]);

  const handleCompleteTransfer = async (id: string, transferNumber: string) => {
    try {
      const res = await api.post(`/transfers/${id}/complete`);
      if (res.data?.success) {
        showToast({
          type: 'success',
          title: 'Transfer Completed',
          message: `${transferNumber} completed: Rack quantities updated, total stock conserved!`,
        });
        fetchTransfers();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Transfer Failed',
        message: err.response?.data?.error?.message || 'Failed to complete transfer',
      });
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sourceLocationId || !formData.destLocationId) {
      showToast({ type: 'warning', message: 'Please select both source and destination locations.' });
      return;
    }

    try {
      const res = await api.post('/transfers', {
        ...formData,
        items: formData.items.map((it) => ({
          ...it,
          quantity: Number(it.quantity),
        })),
      });

      if (res.data?.success) {
        showToast({
          type: 'success',
          title: 'Transfer Scheduled',
          message: `Internal transfer ${res.data.data.transfer.transferNumber} scheduled.`,
        });
        setIsCreateOpen(false);
        fetchTransfers();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.error?.message || 'Failed to schedule transfer',
      });
    }
  };

  const sourceWarehouse = warehouses.find((w) => w.id === formData.sourceWarehouseId);
  const destWarehouse = warehouses.find((w) => w.id === formData.destWarehouseId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Internal Stock Transfers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Location A → Location B internal inventory rebalancing (total stock conserved)
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Internal Transfer</span>
        </button>
      </div>

      {/* Transfers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Transfer Number</th>
                <th className="py-3 px-4 font-semibold">Source Location</th>
                <th className="py-3 px-4 font-semibold">Destination Location</th>
                <th className="py-3 px-4 font-semibold text-center">Items / Quantity</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No internal transfers recorded.
                  </td>
                </tr>
              ) : (
                transfers.map((trf) => (
                  <tr
                    key={trf.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-slate-100">
                      {trf.transferNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {trf.sourceLocation?.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {trf.sourceWarehouse?.name} ({trf.sourceLocation?.code})
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {trf.destLocation?.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {trf.destWarehouse?.name} ({trf.destLocation?.code})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {trf.items.reduce((s, it) => s + it.quantity, 0)} units
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {trf.items[0]?.product?.name || 'Item'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">
                        {trf.status === 'COMPLETED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending Relocation
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {trf.status !== 'COMPLETED' && trf.status !== 'CANCELED' && (
                        <button
                          onClick={() => handleCompleteTransfer(trf.id, trf.transferNumber)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow-xs hover:shadow transition-all active:scale-95"
                        >
                          Complete Transfer
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transfer Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                <span>Create Internal Warehouse Transfer</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              {/* Source Selection */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">Source Facility *</label>
                  <select
                    required
                    value={formData.sourceWarehouseId}
                    onChange={(e) => setFormData({ ...formData, sourceWarehouseId: e.target.value, sourceLocationId: '' })}
                    className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">Source Rack/Bay *</label>
                  <select
                    required
                    disabled={!formData.sourceWarehouseId}
                    value={formData.sourceLocationId}
                    onChange={(e) => setFormData({ ...formData, sourceLocationId: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                  >
                    <option value="">Select Location</option>
                    {sourceWarehouse?.locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Destination Selection */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-purple-900 dark:text-purple-300 uppercase">Dest Facility *</label>
                  <select
                    required
                    value={formData.destWarehouseId}
                    onChange={(e) => setFormData({ ...formData, destWarehouseId: e.target.value, destLocationId: '' })}
                    className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-purple-900 dark:text-purple-300 uppercase">Dest Rack/Bay *</label>
                  <select
                    required
                    disabled={!formData.destWarehouseId}
                    value={formData.destLocationId}
                    onChange={(e) => setFormData({ ...formData, destLocationId: e.target.value })}
                    className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                  >
                    <option value="">Select Location</option>
                    {destWarehouse?.locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product & Quantity */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Product *</label>
                  <select
                    required
                    value={formData.items[0].productId}
                    onChange={(e) => {
                      const updated = [...formData.items];
                      updated[0].productId = e.target.value;
                      setFormData({ ...formData, items: updated });
                    }}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select Product to Move</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.items[0].quantity}
                    onChange={(e) => {
                      const updated = [...formData.items];
                      updated[0].quantity = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, items: updated });
                    }}
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
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-sm"
                >
                  Schedule Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
