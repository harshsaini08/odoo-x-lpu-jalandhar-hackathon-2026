import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { CommandBarModal } from './CommandBarModal';
import { DemoWalkthroughModal } from '../demo/DemoWalkthroughModal';
import { CopilotDrawer } from '../copilot/CopilotDrawer';

interface AppLayoutProps {
  healthScore?: number;
  activeAlertCount?: number;
  onRefreshData?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  healthScore = 84,
  activeAlertCount = 2,
  onRefreshData,
}) => {
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          onOpenCommandBar={() => setIsCommandBarOpen(true)}
          onRunDemo={() => setIsDemoModalOpen(true)}
          healthScore={healthScore}
          activeAlertCount={activeAlertCount}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>

      {/* StockSense Copilot Floating Assistant */}
      <CopilotDrawer />

      {/* Global Command Center */}
      <CommandBarModal
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        onRunDemo={() => setIsDemoModalOpen(true)}
      />

      {/* Interactive Demo Walkthrough Modal */}
      <DemoWalkthroughModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onRefreshData={onRefreshData}
      />
    </div>
  );
};
