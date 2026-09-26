import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Package,
  ArrowRightLeft,
  Truck,
  Inbox,
  AlertTriangle,
  Activity,
  Warehouse,
  FileText,
  Sparkles,
  Sliders,
  PlayCircle,
  X,
} from 'lucide-react';

interface CommandBarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunDemo: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'NAVIGATION' | 'FILTER' | 'ACTIONS' | 'INTELLIGENCE';
  icon: any;
  action: () => void;
  keywords: string[];
}

export const CommandBarModal: React.FC<CommandBarModalProps> = ({
  isOpen,
  onClose,
  onRunDemo,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const commands: CommandItem[] = [
    {
      id: 'demo-run',
      title: 'Run Interactive Inventory Demo Scenario',
      subtitle: 'Executes the 4-step Steel Rods manufacturing workflow live',
      category: 'ACTIONS',
      icon: PlayCircle,
      action: () => {
        onClose();
        onRunDemo();
      },
      keywords: ['demo', 'scenario', 'steel rods', 'walkthrough', 'presentation', 'run'],
    },
    {
      id: 'prod-low-stock',
      title: 'Filter Low Stock Products',
      subtitle: 'View all catalog items currently below safety reorder thresholds',
      category: 'FILTER',
      icon: AlertTriangle,
      action: () => {
        navigate('/products?status=LOW_STOCK');
        onClose();
      },
      keywords: ['low stock', 'reorder', 'danger', 'threshold', 'critical', 'warning'],
    },
    {
      id: 'prod-out-stock',
      title: 'Filter Out of Stock Products',
      subtitle: 'View items with 0 available units across all warehouse locations',
      category: 'FILTER',
      icon: AlertTriangle,
      action: () => {
        navigate('/products?status=OUT_OF_STOCK');
        onClose();
      },
      keywords: ['out of stock', 'zero stock', 'empty', 'stockout', 'depleted'],
    },
    {
      id: 'nav-steel',
      title: 'Search "Steel Rods" (Demo Item)',
      subtitle: 'Open product details, stock by location & ledger history for Steel Rods',
      category: 'NAVIGATION',
      icon: Package,
      action: () => {
        navigate('/products?search=Steel');
        onClose();
      },
      keywords: ['steel', 'rods', 'raw materials', 'sku-stl-001'],
    },
    {
      id: 'nav-pending-del',
      title: 'Show Pending Customer Deliveries',
      subtitle: 'View delivery orders waiting for pick, pack, and shipment validation',
      category: 'NAVIGATION',
      icon: Truck,
      action: () => {
        navigate('/deliveries?status=WAITING');
        onClose();
      },
      keywords: ['pending deliveries', 'deliveries', 'orders', 'dispatch', 'customers'],
    },
    {
      id: 'nav-pending-rec',
      title: 'Show Inbound Vendor Receipts',
      subtitle: 'Inspect scheduled and ready supplier intake shipments',
      category: 'NAVIGATION',
      icon: Inbox,
      action: () => {
        navigate('/receipts?status=READY');
        onClose();
      },
      keywords: ['pending receipts', 'receipts', 'inbound', 'supplier', 'intake', 'dock'],
    },
    {
      id: 'nav-transfers',
      title: 'Show Internal Warehouse Transfers',
      subtitle: 'Manage rack rebalancing between Main Warehouse and Production Floor',
      category: 'NAVIGATION',
      icon: ArrowRightLeft,
      action: () => {
        navigate('/transfers');
        onClose();
      },
      keywords: ['transfers', 'internal transfers', 'movements', 'racks', 'relocate'],
    },
    {
      id: 'nav-intel-health',
      title: 'Explain Inventory Health Score',
      subtitle: 'Open explainable 0-100 health scoring and decision-support breakdown',
      category: 'INTELLIGENCE',
      icon: Sparkles,
      action: () => {
        navigate('/intelligence');
        onClose();
      },
      keywords: ['health', 'score', 'why', 'intelligence', 'breakdown', 'ai', 'algorithm'],
    },
    {
      id: 'nav-warehouses',
      title: 'Open Digital Twin Warehouse Map',
      subtitle: 'Explore 2D rack utilization layout and live location stocks',
      category: 'NAVIGATION',
      icon: Warehouse,
      action: () => {
        navigate('/warehouses');
        onClose();
      },
      keywords: ['warehouse 1', 'warehouse', 'racks', 'locations', 'capacity', 'digital twin', 'main warehouse'],
    },
    {
      id: 'nav-ledger',
      title: 'Audit Stock Ledger & Movements',
      subtitle: 'Immutable chronological transaction history with CSV export',
      category: 'NAVIGATION',
      icon: Activity,
      action: () => {
        navigate('/ledger');
        onClose();
      },
      keywords: ['ledger', 'stock ledger', 'history', 'audit', 'transactions', 'csv'],
    },
    {
      id: 'nav-reports',
      title: 'View Inventory Valuation & Aging Reports',
      subtitle: 'Financial valuation, movement velocity, and dead stock analysis',
      category: 'NAVIGATION',
      icon: FileText,
      action: () => {
        navigate('/reports');
        onClose();
      },
      keywords: ['reports', 'valuation', 'financial', 'aging', 'dead stock', 'summary'],
    },
    {
      id: 'nav-adjustments',
      title: 'Record Inventory Physical Adjustment',
      subtitle: 'Log physical count discrepancy with mandatory reason justification',
      category: 'ACTIONS',
      icon: Sliders,
      action: () => {
        navigate('/adjustments');
        onClose();
      },
      keywords: ['adjustment', 'count', 'physical count', 'damaged', 'lost', 'correction'],
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    if (cmd.title.toLowerCase().includes(q)) return true;
    if (cmd.subtitle.toLowerCase().includes(q)) return true;
    return cmd.keywords.some((k) => k.includes(q));
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search (e.g. 'steel', 'low stock', 'pending deliveries', 'warehouse 1')..."
            className="w-full py-4 text-slate-900 dark:text-slate-100 bg-transparent placeholder-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/50">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No matching commands found for &ldquo;{query}&rdquo;. Try typing &quot;steel&quot;, &quot;low stock&quot;, or &quot;deliveries&quot;.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      cmd.category === 'ACTIONS'
                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
                        : cmd.category === 'FILTER'
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                        : cmd.category === 'INTELLIGENCE'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {cmd.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {cmd.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {cmd.subtitle}
                    </p>
                  </div>
                  {isSelected && (
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/60 rounded">
                      ↵ Enter
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="font-medium text-brand-600 dark:text-brand-400">
            StockSense Intelligent Command Center
          </span>
        </div>
      </div>
    </div>
  );
};
