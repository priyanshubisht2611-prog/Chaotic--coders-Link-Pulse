import React from 'react';
import { ShieldCheck, BarChart3, Link2, Chrome, Server, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BackendStatus } from '../types';

export type WorkspaceTab = 'shorten' | 'analytics' | 'security';

interface NavbarProps {
  currentTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenChromeModal: () => void;
  onOpenBackendModal: () => void;
  backendStatus: BackendStatus;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenChromeModal,
  onOpenBackendModal,
  backendStatus
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('shorten')}
            className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Link2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                Link<span className="text-blue-600">Pulse</span>
              </span>
              <span className="text-[11px] font-medium text-slate-600 tracking-normal mt-0.5">
                AI Shortener & Security
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSelectTab('shorten')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'shorten'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Shorten</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'analytics'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => onSelectTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'security'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Security</span>
          </button>

          <button
            onClick={onOpenChromeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            <Chrome className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Add to</span> Chrome
          </button>
        </nav>

        {/* Zone 3: Backend Status & Quick Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenBackendModal}
            title={backendStatus.isConnected ? 'Connected to FastAPI Backend' : 'FastAPI Offline - Using Local Engine'}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition-colors"
          >
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">API:</span>
            {backendStatus.isConnected ? (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                FastAPI
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Local Engine
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
