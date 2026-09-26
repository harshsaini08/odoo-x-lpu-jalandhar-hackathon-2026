import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Eye,
  Warehouse,
  User,
  Calendar,
  X,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import api from '../api/client';
import { Receipt, Supplier, Warehouse as WarehouseType, Product } from '../types';
import { useToast } from '../context/ToastContext';

export const ReceiptsPage: React.FC = () => {
  const { showToast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Create Form State
  const [formData, setFormData] = useState({
    supplierId: '',
    warehouseId: '',
    expectedDate: '',
    notes: '',
    items: [{ productId: '', locationId: '', orderedQuantity: 50, unitPrice: 0 }],
  });

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;

      const [recRes, supRes, whRes, prodRes] = await Promise.all([
        api.get('/receipts', { params }),
        api.get('/suppliers'),
        api.get('/warehouses'),
        api.get('/products'),
      ]);

      if (recRes.data?.success) setReceipts(recRes.data.data.items);
      if (supRes.data?.success) setSuppliers(supRes.data.data.suppliers);
      if (whRes.data?.success) setWarehouses(whRes.data.data.warehouses);
      if (prodRes.data?.success) setProducts(prodRes.data.data.items);
    } catch (err) {
      console.error('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [statusFilter, search]);

  const handleValidateReceipt = async (id: string, receiptNumber: string) => {
    try {
      const res = await api.post(`/receipts/${id}/validate`);
      if (res.data?.success) {
        showToast({
          type: 'success',
          title: 'Receipt Validated',
          message: `${receiptNumber} processed: Inventory increased & stock ledger entry recorded!`,
        });
        fetchReceipts();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Validation Failed',
        message: err.response?.data?.error?.message || 'Failed to validate receipt',
      });
    }
  };

  const handleAddItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', locationId: '', orderedQuantity: 10, unitPrice: 0 }],
    });
  };

  const handleRemoveItemRow = (index: number) => {
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData({ ...formData, items: updated });
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId || !formData.warehouseId) {
      showToast({ type: 'warning', message: 'Please select a supplier and warehouse.' });
      return;
    }

    try {
      const res = await api.post('/receipts', {
        ...formData,
        items: formData.items.map((it) => ({
          ...it,
          orderedQuantity: Number(it.orderedQuantity),
          unitPrice: Number(it.unitPrice),
        })),
      });

      if (res.data?.success) {
        showToast({
          type: 'success',
          title: 'Receipt Created',
          message: `Inbound receipt ${res.data.data.receipt.receiptNumber} scheduled successfully.`,
        });
        setIsCreateOpen(false);
        fetchReceipts();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.error?.message || 'Failed to create receipt',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DONE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Done / Received
          </span>
        );
      case 'READY':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Ready for Intake
          </span>
        );
      case 'WAITING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Waiting Shipment
          </span>
        );
      case 'CANCELED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Canceled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Inbound Vendor Receipts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Vendor → Warehouse stock intake & receiving inspection dock
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Inbound Receipt</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-subtle">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by receipt number, supplier name..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="WAITING">Waiting</option>
            <option value="READY">Ready for Intake</option>
            <option value="DONE">Done / Completed</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Receipt Number</th>
                <th className="py-3 px-4 font-semibold">Supplier</th>
                <th className="py-3 px-4 font-semibold">Destination Facility</th>
                <th className="py-3 px-4 font-semibold text-center">Items</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold">Expected / Received</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No receipts found matching your criteria.
                  </td>
                </tr>
              ) : (
                receipts.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-slate-100">
                      {rec.receiptNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {rec.supplier?.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {rec.warehouse?.name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {rec.items.length} item(s)
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {rec.items.reduce((sum, it) => sum + (it.orderedQuantity || 0), 0)} units total
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">{getStatusBadge(rec.status)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {rec.status === 'DONE' && rec.receivedDate ? (
                        <div>
                          <span className="font-semibold text-emerald-600">Received:</span>{' '}
                          {new Date(rec.receivedDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <div>
                          <span>Expected:</span>{' '}
                          {rec.expectedDate ? new Date(rec.expectedDate).toLocaleDateString() : 'Immediate'}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rec.status !== 'DONE' && rec.status !== 'CANCELED' && (
                          <button
                            onClick={() => handleValidateReceipt(rec.id, rec.receiptNumber)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs hover:shadow transition-all active:scale-95"
                          >
                            Validate Intake
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedReceipt(rec)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Inbound Receipt Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Inbox className="w-5 h-5 text-emerald-600" />
                <span>Schedule New Inbound Vendor Receipt</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Supplier *</label>
                  <select
                    required
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) - {s.leadTimeDays}d lead time
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Receiving Warehouse *</label>
                  <select
                    required
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Line Items */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Inbound Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-brand-600 flex items-center gap-1 hover:underline"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {formData.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                    <select
                      required
                      value={item.productId}
                      onChange={(e) => {
                        const updated = [...formData.items];
                        updated[idx].productId = e.target.value;
                        const prod = products.find((p) => p.id === e.target.value);
                        if (prod) {
                          updated[idx].unitPrice = prod.costPrice;
                          updated[idx].locationId = prod.defaultLocationId || '';
                        }
                        setFormData({ ...formData, items: updated });
                      }}
                      className="flex-1 p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      required
                      min="1"
                      value={item.orderedQuantity}
                      onChange={(e) => {
                        const updated = [...formData.items];
                        updated[idx].orderedQuantity = parseFloat(e.target.value) || 0;
                        setFormData({ ...formData, items: updated });
                      }}
                      placeholder="Qty"
                      className="w-24 p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />

                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes & Inspection Instructions</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Inspect mill test certificates at bay 1"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm"
                >
                  Save Inbound Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Inbound Receipt Details: {selectedReceipt.receiptNumber}
                </h3>
                <p className="text-xs text-slate-400">Supplier: {selectedReceipt.supplier?.name}</p>
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="font-semibold text-xs text-slate-700 dark:text-slate-300">Shipment Items:</div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden">
                {selectedReceipt.items.map((it) => (
                  <div key={it.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{it.product?.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{it.product?.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {it.orderedQuantity} {it.product?.unitOfMeasure}
                      </div>
                      <div className="text-[10px] text-slate-400">Unit Price: ${it.unitPrice}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
