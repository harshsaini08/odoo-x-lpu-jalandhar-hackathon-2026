import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Inbox,
  Truck,
  ArrowRightLeft,
  Sliders,
  Activity,
  Warehouse,
  Sparkles,
  Bell,
  BarChart3,
  Settings,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navSections = [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      ],
    },
    {
      title: 'INVENTORY',
      items: [
        { name: 'Products Catalog', path: '/products', icon: Package },
        { name: 'Stock Overview', path: '/warehouses', icon: Layers },
        { name: 'Stock Ledger (Move History)', path: '/ledger', icon: Activity },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Inbound Receipts', path: '/receipts', icon: Inbox },
        { name: 'Delivery Orders', path: '/deliveries', icon: Truck },
        { name: 'Internal Transfers', path: '/transfers', icon: ArrowRightLeft },
        { name: 'Stock Adjustments', path: '/adjustments', icon: Sliders },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        {
          name: 'Demand Forecast',
          path: '/forecast',
          icon: Sparkles,
          highlight: true,
          badge: 'AI Forecast',
        },
        { name: 'Reorder Recommendations', path: '/intelligence', icon: BarChart3 },
      ],
    },
    {
      title: 'WAREHOUSES',
      items: [
        { name: 'Warehouses & Digital Twin', path: '/warehouses', icon: Warehouse },
      ],
    },
    {
      title: 'REPORTS',
      items: [
        { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Alerts & Anomalies', path: '/alerts', icon: Bell },
        { name: 'System Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-sidebar-bg text-sidebar-text flex flex-col border-r border-sidebar-border select-none z-40">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
          <Layers className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
            <span>STOCKSENSE</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-brand-500/20 text-brand-400 rounded-full border border-brand-500/30">
              v1.0
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">
            Intelligent Inventory Operations
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? item.highlight
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-semibold'
                          : 'bg-sidebar-hover text-sidebar-textActive font-semibold'
                        : item.highlight
                        ? 'text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-sidebar-hover/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : item.highlight
                            ? 'text-emerald-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Status Card */}
      <div className="p-3 border-t border-sidebar-border bg-slate-950/40">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-sidebar-card/60 border border-sidebar-border/60">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SS'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user?.name || 'Inventory Manager'}</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
              <ShieldCheck className="w-3 h-3 text-brand-400" />
              <span>{user?.role?.replace('_', ' ') || 'MANAGER'}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
