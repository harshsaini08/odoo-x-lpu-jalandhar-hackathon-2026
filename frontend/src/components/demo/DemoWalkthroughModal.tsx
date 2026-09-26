import React, { useState } from 'react';
import {
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Inbox,
  ArrowRightLeft,
  Truck,
  Sliders,
  Activity,
  X,
  RotateCcw,
  Layers,
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

interface DemoWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const DemoWalkthroughModal: React.FC<DemoWalkthroughModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [stepLogs, setStepLogs] = useState<string[]>([]);
  const [stockLevel, setStockLevel] = useState<number>(42);

  const steps = [
    {
      step: 0,
      title: 'Initial State: Critical Stockout Detected',
      subtitle: 'Raw Material "Steel Rods" is below safety reorder threshold',
      icon: Layers,
      color: 'amber',
      description:
        'Beginning Inventory: 42 kg. System calculates Reorder Point = 50 kg (Daily usage: 8 kg/day, Lead time: 5 days). StockSense generates a CRITICAL reorder recommendation.',
      actionLabel: 'Begin Scenario: Step 1 Inbound Receipt (+100 kg)',
      badge: 'Baseline: 42 kg',
    },
    {
      step: 1,
      title: 'Step 1: Inbound Vendor Receipt',
      subtitle: 'Receive 100 kg Steel Rods from Apex Steel & Alloys Corp',
      icon: Inbox,
      color: 'emerald',
      description:
        'Supplier delivers 100 kg high-tensile steel rods at Main Warehouse Rack A. Validating the receipt mutates inventory transactionally and logs an immutable ledger entry.',
      actionLabel: 'Execute Step 1: Validate Receipt (+100 kg)',
      badge: 'Expected: 142 kg',
    },
    {
      step: 2,
      title: 'Step 2: Internal Warehouse Transfer',
      subtitle: 'Move 50 kg from Main Warehouse → Production Plant Rack P1',
      icon: ArrowRightLeft,
      color: 'blue',
      description:
        'Staging raw material for active assembly. Notice that total inventory remains invariant at 142 kg while location rack balances adjust dynamically in the Digital Twin.',
      actionLabel: 'Execute Step 2: Complete Transfer (50 kg)',
      badge: 'Expected: 142 kg (Conserved)',
    },
    {
      step: 3,
      title: 'Step 3: Outbound Customer Delivery',
      subtitle: 'Fulfill & dispatch 20 kg to Apex Fabrication Ltd',
      icon: Truck,
      color: 'indigo',
      description:
        'Customer order validation verifies available stock, decrements quantity from Production Rack P1, and logs customer reference TXN-DEL in the ledger.',
      actionLabel: 'Execute Step 3: Validate Delivery (-20 kg)',
      badge: 'Expected: 122 kg',
    },
    {
      step: 4,
      title: 'Step 4: Physical Inventory Adjustment',
      subtitle: 'Log -3 kg damage detected during quality bend test',
      icon: Sliders,
      color: 'rose',
      description:
        'Quality inspector detects 3 kg bent/damaged rods. System logs an adjustment with required variance reason "Quality reject", triggers anomaly tracking, and updates baseline.',
      actionLabel: 'Execute Step 4: Record Adjustment (-3 kg)',
      badge: 'Expected: 119 kg',
    },
    {
      step: 5,
      title: 'Scenario Completed: Reconciliation Verified!',
      subtitle: 'Transparent "Why Did Stock Change?" mathematical audit trail',
      icon: CheckCircle2,
      color: 'emerald',
      description:
        'Final Stock: exactly 119 kg. Net Change: +77 kg (Starting 42 + Receipts 100 - Deliveries 20 - Adjustments 3 = 119 kg). All transactions are recorded in the Stock Ledger.',
      actionLabel: 'Finish Walkthrough',
      badge: 'Final: 119 kg',
    },
  ];

  const handleExecuteStep = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }

    if (currentStep === 5) {
      onClose();
      if (onRefreshData) onRefreshData();
      return;
    }

    setIsExecuting(true);
    try {
      const res = await api.post('/demo/scenario-step', { step: currentStep });
      if (res.data?.success) {
        const data = res.data.data;
        setStockLevel(data.currentStock);
        setStepLogs((prev) => [...prev, res.data.message]);
        showToast({
          type: 'success',
          title: `Step ${currentStep} Success`,
          message: res.data.message,
        });

        setCurrentStep((prev) => prev + 1);
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Demo Step Failed',
        message: err.response?.data?.error?.message || 'Failed to execute demo step',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleResetDemo = async () => {
    setCurrentStep(0);
    setStepLogs([]);
    setStockLevel(42);
    showToast({
      type: 'info',
      title: 'Demo Reset',
      message: 'Scenario reset to initial baseline state.',
    });
  };

  if (!isOpen) return null;

  const active = steps[currentStep] || steps[0];
  const Icon = active.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                <span>StockSense Live Hackathon Demo</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold uppercase">
                  Interactive
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                End-to-End Manufacturing Workflow: Steel Rods Lifecycle
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDemo}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
              title="Reset Demo Workflow"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="px-6 pt-4 pb-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Stage {currentStep + 1} of {steps.length}: {active.title}
            </span>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
              Current Stock: {stockLevel} kg
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {steps.map((s, idx) => (
              <div
                key={s.step}
                className={`h-full flex-1 transition-all duration-300 ${
                  idx < currentStep
                    ? 'bg-emerald-500'
                    : idx === currentStep
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Step Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-800/60 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  active.color === 'emerald'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    : active.color === 'blue'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                    : active.color === 'indigo'
                    ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                    : active.color === 'rose'
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {active.title}
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {active.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {active.subtitle}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
              {active.description}
            </p>
          </div>

          {/* Mathematical Reconciliation Summary */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-300 mb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <Activity className="w-4 h-4 text-emerald-600" />
                Why Did Stock Change? Reconciliation:
              </span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                Net Change: +{Math.max(0, stockLevel - 42)} kg
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60">
                <div className="text-[10px] text-slate-500">Starting Stock</div>
                <div className="font-bold text-slate-900 dark:text-slate-100">42 kg</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60">
                <div className="text-[10px] text-emerald-600 font-semibold">+ Receipts</div>
                <div className="font-bold text-emerald-600">{currentStep >= 2 ? '+100 kg' : '0 kg'}</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60">
                <div className="text-[10px] text-rose-600 font-semibold">- Deliveries</div>
                <div className="font-bold text-rose-600">{currentStep >= 4 ? '-20 kg' : '0 kg'}</div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60">
                <div className="text-[10px] text-amber-600 font-semibold">± Adjustments</div>
                <div className="font-bold text-amber-600">{currentStep >= 5 ? '-3 kg' : '0 kg'}</div>
              </div>
            </div>
          </div>

          {/* Execution History Log */}
          {stepLogs.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Execution Ledger Log
              </div>
              <div className="space-y-1 bg-slate-900 p-3 rounded-xl font-mono text-[11px] text-emerald-400 max-h-32 overflow-y-auto">
                {stepLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleExecuteStep}
            disabled={isExecuting}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
          >
            {isExecuting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Executing Operation...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>{active.actionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
