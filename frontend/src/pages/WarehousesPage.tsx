import React, { useState, useEffect } from 'react';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Layers,
  Box,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import api from '../api/client';
import { Warehouse, WarehouseLocationDetail } from '../types';
import { DigitalTwinGrid } from '../components/warehouses/DigitalTwinGrid';
import { useToast } from '../context/ToastContext';

export const WarehousesPage: React.FC = () => {
  const { showToast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateWhOpen, setIsCreateWhOpen] = useState(false);
  const [isCreateLocOpen, setIsCreateLocOpen] = useState(false);

  const [whFormData, setWhFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    totalCapacity: 10000,
  });

  const [locFormData, setLocFormData] = useState({
    warehouseId: '',
    name: '',
    code: '',
    rackNumber: '',
    shelfNumber: '',
    capacity: 2000,
    type: 'STORAGE',
  });

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warehouses');
      if (res.data?.success) setWarehouses(res.data.data.warehouses);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/warehouses', {
        ...whFormData,
        totalCapacity: Number(whFormData.totalCapacity),
      });

      if (res.data?.success) {
        showToast({
          type: 'success',
          title: 'Warehouse Created',
          message: `Facility ${whFormData.name} (${whFormData.code}) added successfully.`,
        });
        setIsCreateWhOpen(false);
        fetchWarehouses();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.error?.message || 'Failed to create warehouse',
      });
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/warehouses/locations', {
        ...locFormData,
        capacity: Number(locFormData.capacity),
      });

      if (res.data?.success) {
        showToast({
          type: 'success',
          title: 'Location Created',
          message: `Rack ${locFormData.name} added to warehouse.`,
        });
        setIsCreateLocOpen(false);
        fetchWarehouses();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.error?.message || 'Failed to create location',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Warehouses & Digital Twin Map
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-facility management, 2D spatial rack utilization, and real-time inventory allocation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateLocOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Add Rack/Bay</span>
          </button>
          <button
            onClick={() => setIsCreateWhOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Warehouse</span>
          </button>
        </div>
      </div>

      {/* Primary 2D Digital Twin Component */}
      <DigitalTwinGrid warehouses={warehouses} />

      {/* Create Warehouse Modal */}
      {isCreateWhOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Add New Warehouse Facility
              </h3>
              <button onClick={() => setIsCreateWhOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  value={whFormData.name}
                  onChange={(e) => setWhFormData({ ...whFormData, name: e.target.value })}
                  placeholder="e.g. East Coast Logistics Depot"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Code *</label>
                <input
                  type="text"
                  required
                  value={whFormData.code}
                  onChange={(e) => setWhFormData({ ...whFormData, code: e.target.value.toUpperCase() })}
                  placeholder="WH-EAST"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Capacity (Units)</label>
                <input
                  type="number"
                  value={whFormData.totalCapacity}
                  onChange={(e) => setWhFormData({ ...whFormData, totalCapacity: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateWhOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Location Modal */}
      {isCreateLocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Add New Location / Rack Bay
              </h3>
              <button onClick={() => setIsCreateLocOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Warehouse *</label>
                <select
                  required
                  value={locFormData.warehouseId}
                  onChange={(e) => setLocFormData({ ...locFormData, warehouseId: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location / Rack Name *</label>
                <input
                  type="text"
                  required
                  value={locFormData.name}
                  onChange={(e) => setLocFormData({ ...locFormData, name: e.target.value })}
                  placeholder="e.g. Rack D (Electronics)"
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location Code *</label>
                  <input
                    type="text"
                    required
                    value={locFormData.code}
                    onChange={(e) => setLocFormData({ ...locFormData, code: e.target.value.toUpperCase() })}
                    placeholder="LOC-MD1"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Capacity (Units)</label>
                  <input
                    type="number"
                    value={locFormData.capacity}
                    onChange={(e) => setLocFormData({ ...locFormData, capacity: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateLocOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
