import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  Warehouse,
  User,
  Calendar,
  X,
  PlusCircle,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import api from '../api/client';
import { Delivery, Customer, Warehouse as WarehouseType, Product } from '../types';
import { useToast } from '../context/ToastContext';

export const DeliveriesPage: React.FC = () => {
  const { showToast } = useToast();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // Create Form State
  const [formData, setFormData] = useState({
    customerId: '',
    warehouseId: '',
    destination: '',
    trackingNumber: '',
    notes: '',
    items: [{ productId: '', locationId: '', requestedQuantity: 20, unitPrice: 0 }],
  });

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;

      const [delRes, custRes, whRes, prodRes] = await Promise.all([
        api.get('/deliveries', { params }),
        api.get('/customers'),
        api.get('/warehouses'),
        api.get('/products'),
      ]);

      if (delRes.data?.success) setDeliveries(delRes.data.data.items);
      if (custRes.data?.success) setCustomers(custRes.data.data.customers);
      if (whRes.data?.success) setWarehouses(whRes.data.data.warehouses);
      if (prodRes.data?.success) setProducts(prodRes.data.data.items);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter, search]);

  const handleValidateDelivery = async (id: string, deliveryNumber: string) => {
    try {
      const res = await api.post(`/deliveries/${id}/validate`);
      if (res.data?.success) {
        showToast({
          type: 'success',
          title: 'Delivery Dispatched',
          message: `${deliveryNumber} validated: Inventory deducted and ledger entry created!`,
        });
        fetchDeliveries();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Dispatch Blocked',
        message: err.response?.data?.error?.message || 'Insufficient stock to fulfill delivery',
      });
    }
  };

  const handleProgressStatus = async (id: string, nextStatus: string) => {
    try {
      const res = await api.put(`/deliveries/${id}/status`, { status: nextStatus });
      if (res.data?.success) {
        showToast({
          type: 'info',
          title: 'Workflow Progressed',
          message: `Delivery status updated to ${nextStatus}`,
        });
        fetchDeliveries();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.error?.message || 'Failed to update delivery status',
      });
    }
  };

  const handleAddItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', locationId: '', requestedQuantity: 10, unitPrice: 0 }],
    });
  };

  const handleRemoveItemRow = (index: number) => {
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData({ ...formData, items: updated });
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.warehouseId) {
      showToast({ type: 'warning', message: 'Please select a customer and warehouse.' });
      return;
    }

    try {
      const res = await api.post('/deliveries', {
        ...formData,
        items: formData.items.map((it) => ({
          ...it,
          requestedQuantity: Number(it.requestedQuantity),
          unitPrice: Number(it.unitPrice),
        })),
      });

      if (res.data?.success) {
        showToast({
          type: 'success',
          title: 'Delivery Order Created',
          message: `Delivery order ${res.data.data.delivery.deliveryNumber} queued for fulfillment.`,
        });
        setIsCreateOpen(false);
        fetchDeliveries();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.error?.message || 'Failed to create delivery order',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DONE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Done / Dispatched
          </span>
        );
      case 'PACKED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
            Packed
          </span>
        );
      case 'PICKED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
            Picked
          </span>
        );
      case 'READY':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
            Ready
          </span>
        );
      case 'WAITING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Waiting
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
            Customer Delivery Orders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Warehouse → Customer fulfillment, pick & pack workflow, and stock dispatch
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Delivery Order</span>
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
            placeholder="Search by delivery number, customer name, destination..."
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
            <option value="READY">Ready</option>
            <option value="PICKED">Picked</option>
            <option value="PACKED">Packed</option>
            <option value="DONE">Done / Dispatched</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Delivery Order</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Dispatch Facility</th>
                <th className="py-3 px-4 font-semibold text-center">Items</th>
                <th className="py-3 px-4 font-semibold text-center">Workflow Status</th>
                <th className="py-3 px-4 font-semibold">Scheduled Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No delivery orders found.
                  </td>
                </tr>
              ) : (
                deliveries.map((del) => (
                  <tr
                    key={del.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-slate-100">
                      {del.deliveryNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {del.customer?.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {del.warehouse?.name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {del.items.length} item(s)
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {del.items.reduce((sum, it) => sum + (it.requestedQuantity || 0), 0)} units total
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">{getStatusBadge(del.status)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {del.scheduledDate ? new Date(del.scheduledDate).toLocaleDateString() : 'Immediate'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {del.status === 'WAITING' && (
                          <button
                            onClick={() => handleProgressStatus(del.id, 'READY')}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[11px]"
                          >
                            Mark Ready
                          </button>
                        )}
                        {del.status === 'READY' && (
                          <button
                            onClick={() => handleProgressStatus(del.id, 'PICKED')}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 font-semibold text-[11px]"
                          >
                            Mark Picked
                          </button>
                        )}
                        {del.status === 'PICKED' && (
                          <button
                            onClick={() => handleProgressStatus(del.id, 'PACKED')}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 font-semibold text-[11px]"
                          >
                            Mark Packed
                          </button>
                        )}
                        {del.status === 'PACKED' && (
                          <button
                            onClick={() => handleValidateDelivery(del.id, del.deliveryNumber)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs hover:shadow transition-all active:scale-95"
                          >
                            Validate Dispatch
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedDelivery(del)}
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

      {/* Create Delivery Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <span>Create New Customer Delivery Order</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Customer *</label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fulfillment Warehouse *</label>
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

              {/* Line Items */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Requested Order Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline"
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
                          updated[idx].unitPrice = prod.sellingPrice;
                          updated[idx].locationId = prod.defaultLocationId || '';
                        }
                        setFormData({ ...formData, items: updated });
                      }}
                      className="flex-1 p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select Product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.currentStock} {p.unitOfMeasure})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      required
                      min="1"
                      value={item.requestedQuantity}
                      onChange={(e) => {
                        const updated = [...formData.items];
                        updated[idx].requestedQuantity = parseFloat(e.target.value) || 0;
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Destination Address</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g. Apex Plant 3, Gary, IN"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tracking Reference</label>
                  <input
                    type="text"
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                    placeholder="TRK-984210"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
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
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-sm"
                >
                  Save Delivery Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Delivery Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Delivery Order Details: {selectedDelivery.deliveryNumber}
                </h3>
                <p className="text-xs text-slate-400">Customer: {selectedDelivery.customer?.name}</p>
              </div>
              <button onClick={() => setSelectedDelivery(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="font-semibold text-xs text-slate-700 dark:text-slate-300">Order Items:</div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden">
                {selectedDelivery.items.map((it) => (
                  <div key={it.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{it.product?.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{it.product?.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600 dark:text-blue-400">
                        {it.requestedQuantity} {it.product?.unitOfMeasure}
                      </div>
                      <div className="text-[10px] text-slate-400">Selling Price: ${it.unitPrice}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3">
              <button
                onClick={() => setSelectedDelivery(null)}
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
