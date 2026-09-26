import React, { useState } from 'react';
import {
  Warehouse as WarehouseIcon,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Box,
  ArrowRight,
  Maximize2,
  X,
} from 'lucide-react';
import { Warehouse, WarehouseLocationDetail } from '../../types';

interface DigitalTwinGridProps {
  warehouses: Warehouse[];
  onSelectProduct?: (sku: string) => void;
}

export const DigitalTwinGrid: React.FC<DigitalTwinGridProps> = ({
  warehouses,
  onSelectProduct,
}) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    warehouses[0]?.id || ''
  );
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocationDetail | null>(null);

  const activeWarehouse =
    warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <WarehouseIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Inventory Digital Twin
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                2D Spatial Matrix
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive rack capacity utilization & live spatial product distribution
            </p>
          </div>
        </div>

        {/* Warehouse Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto">
          {warehouses.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                setSelectedWarehouseId(w.id);
                setSelectedLocation(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedWarehouseId === w.id || (!selectedWarehouseId && w === warehouses[0])
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>
      </div>

      {activeWarehouse && (
        <div className="space-y-6">
          {/* Warehouse Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Facility Code</span>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                {activeWarehouse.code}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Capacity Utilization</span>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1.5">
                <span>{activeWarehouse.utilizationPercent}%</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeWarehouse.utilizationPercent >= 90
                      ? 'bg-rose-500'
                      : activeWarehouse.utilizationPercent >= 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Total Inventory</span>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {activeWarehouse.usedCapacity} / {activeWarehouse.totalCapacity} units
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Low Stock Alerts</span>
              <div className="text-sm font-black text-amber-500 mt-0.5">
                {activeWarehouse.lowStockItemCount} product(s)
              </div>
            </div>
          </div>

          {/* 2D Rack Layout Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <span>2D Storage Bays & Locations</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Click any rack to inspect loaded inventory
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeWarehouse.locations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                        : 'bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 shadow-subtle'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              loc.statusColor === 'red'
                                ? 'bg-rose-500'
                                : loc.statusColor === 'yellow'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {loc.name}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                          {loc.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                        <span>Rack: {loc.rackNumber}</span>
                        <span>•</span>
                        <span>Type: {loc.type}</span>
                        <span>•</span>
                        <span>SKUs: {loc.productCount}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Occupancy</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {loc.usedCapacity} / {loc.capacity} ({loc.utilizationPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div
                          style={{ width: `${loc.utilizationPercent}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            loc.statusColor === 'red'
                              ? 'bg-rose-500'
                              : loc.statusColor === 'yellow'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Location Loaded Products Drawer */}
          {selectedLocation && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4 animate-slide-up">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-brand-600" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Live Stock in {selectedLocation.name} ({selectedLocation.code})
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedLocation.stocks.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No active product inventory allocated to this location rack.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedLocation.stocks.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => onSelectProduct && onSelectProduct(s.sku)}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-brand-500 cursor-pointer transition-colors shadow-xs"
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {s.productName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{s.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {s.quantity} <span className="text-[10px] font-normal text-slate-400">{s.unitOfMeasure}</span>
                        </div>
                        {s.isLowStock && (
                          <span className="text-[9px] font-bold text-rose-500 flex items-center gap-0.5 justify-end mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Low
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
