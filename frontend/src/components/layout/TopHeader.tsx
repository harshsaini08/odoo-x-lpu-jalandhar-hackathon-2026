import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  PlayCircle,
  Bell,
  Sparkles,
  Shield,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Activity,
  CheckCircle2,
  Plus,
  Package,
  Inbox,
  Truck,
  ArrowRightLeft,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface TopHeaderProps {
  onOpenCommandBar: () => void;
  onRunDemo: () => void;
  onQuickCreate?: (type: 'PRODUCT' | 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT') => void;
  healthScore?: number;
  activeAlertCount?: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenCommandBar,
  onRunDemo,
  onQuickCreate,
  healthScore = 84,
  activeAlertCount = 2,
}) => {
  const { user, logout, switchDemoUser } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const navigate = useNavigate();

  const handleRoleSwitch = (role: UserRole) => {
    switchDemoUser(role);
    setShowRoleMenu(false);
  };

  const handleCreateSelection = (type: 'PRODUCT' | 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT') => {
    setShowCreateMenu(false);
    if (onQuickCreate) {
      onQuickCreate(type);
    } else {
      const routes = {
        PRODUCT: '/products?create=true',
        RECEIPT: '/receipts?create=true',
        DELIVERY: '/deliveries?create=true',
        TRANSFER: '/transfers?create=true',
        ADJUSTMENT: '/adjustments?create=true',
      };
      navigate(routes[type]);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      {/* Left: Global Search / Command Bar Trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onOpenCommandBar}
          className="flex items-center justify-between w-full max-w-md px-3.5 py-2 text-sm text-slate-400 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700/70 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition-all shadow-subtle group"
        >
          <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-xs sm:text-sm">Search or command (e.g. &apos;steel&apos;, &apos;low stock&apos;)...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* GLOBAL + CREATE DROPDOWN BUTTON */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {showCreateMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-float border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Quick Create
              </div>
              <button
                onClick={() => handleCreateSelection('PRODUCT')}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left transition-colors"
              >
                <Package className="w-4 h-4 text-brand-600" />
                <span>New Product</span>
              </button>
              <button
                onClick={() => handleCreateSelection('RECEIPT')}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left transition-colors"
              >
                <Inbox className="w-4 h-4 text-emerald-600" />
                <span>New Receipt</span>
              </button>
              <button
                onClick={() => handleCreateSelection('DELIVERY')}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left transition-colors"
              >
                <Truck className="w-4 h-4 text-blue-600" />
                <span>New Delivery Order</span>
              </button>
              <button
                onClick={() => handleCreateSelection('TRANSFER')}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                <span>New Internal Transfer</span>
              </button>
              <button
                onClick={() => handleCreateSelection('ADJUSTMENT')}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left transition-colors"
              >
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>New Stock Adjustment</span>
              </button>
            </div>
          )}
        </div>

        {/* RUN INVENTORY DEMO BUTTON */}
        <button
          onClick={onRunDemo}
          className="relative inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 group overflow-hidden"
        >
          <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <PlayCircle className="w-4 h-4 animate-pulse" />
          <span>Run Inventory Demo</span>
        </button>

        {/* Health Score Pill */}
        <button
          onClick={() => navigate('/intelligence')}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-colors"
          title="Click to view Inventory Health Score breakdown"
        >
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            Health: {healthScore}/100
          </span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Active Inventory Alerts"
        >
          <Bell className="w-5 h-5" />
          {activeAlertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {activeAlertCount}
            </span>
          )}
        </button>

        {/* Quick Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-brand-600" />
            <span>{user?.role ? user.role.replace('_', ' ') : 'MANAGER'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-float border border-slate-200 dark:border-slate-800 p-1 z-50">
              <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase text-slate-400">
                Switch Demo Persona
              </div>
              <button
                onClick={() => handleRoleSwitch('ADMIN')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors ${
                  user?.role === 'ADMIN' ? 'bg-brand-50 text-brand-700 font-semibold dark:bg-brand-950 dark:text-brand-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Administrator</span>
                {user?.role === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
              </button>
              <button
                onClick={() => handleRoleSwitch('INVENTORY_MANAGER')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors ${
                  user?.role === 'INVENTORY_MANAGER' ? 'bg-brand-50 text-brand-700 font-semibold dark:bg-brand-950 dark:text-brand-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Inventory Manager</span>
                {user?.role === 'INVENTORY_MANAGER' && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
              </button>
              <button
                onClick={() => handleRoleSwitch('WAREHOUSE_STAFF')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors ${
                  user?.role === 'WAREHOUSE_STAFF' ? 'bg-brand-50 text-brand-700 font-semibold dark:bg-brand-950 dark:text-brand-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Warehouse Staff</span>
                {user?.role === 'WAREHOUSE_STAFF' && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
              </button>
            </div>
          )}
        </div>

        {/* User Avatar & Logout */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-brand-500/20">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SS'}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-float border border-slate-200 dark:border-slate-800 p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">{user?.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
                <div className="text-[10px] text-brand-600 font-medium mt-0.5">{user?.department}</div>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
