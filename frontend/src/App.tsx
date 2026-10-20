import React, { useState, useEffect } from 'react';
import { Navbar, WorkspaceTab } from './components/Navbar';
import { ShortenWorkspace } from './components/ShortenWorkspace';
import { AnalyticsWorkspace } from './components/AnalyticsWorkspace';
import { SecurityWorkspace } from './components/SecurityWorkspace';
import { ChromeExtensionModal } from './components/ChromeExtensionModal';
import { BackendSettingsModal } from './components/BackendSettingsModal';
import { QrCodeModal } from './components/QrCodeModal';
import { RedirectInterstitial } from './components/RedirectInterstitial';
import { BackendStatus, ShortenedLink } from './types';
import { checkBackendHealth } from './services/api';
import { getStoredApiBaseUrl, getStoredLinks, addStoredLink } from './services/storage';

export default function App() {
  const [currentTab, setCurrentTab] = useState<WorkspaceTab>('shorten');
  const [isChromeModalOpen, setIsChromeModalOpen] = useState(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState<{ isOpen: boolean; url: string }>({
    isOpen: false,
    url: ''
  });

  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    isConnected: false,
    baseUrl: getStoredApiBaseUrl(),
    lastChecked: null
  });

  // Handle URL short link path: /s/:alias
  const [redirectAlias, setRedirectAlias] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/s/')) {
      const alias = path.replace('/s/', '').split('/')[0].trim();
      return alias || null;
    }
    return null;
  });

  useEffect(() => {
    // Check backend health on initial load
    checkBackendHealth().then((status) => {
      setBackendStatus(status);
    });

    // Seed sample link if storage is empty so users can explore immediately
    const existing = getStoredLinks();
    if (existing.length === 0) {
      const starterLink: ShortenedLink = {
        id: 'lnk_starter_1',
        original_url: 'https://github.com/trending',
        short_url: `${window.location.origin}/s/trending-repo`,
        alias: 'trending-repo',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        clicks: 142,
        status: 'active',
        security_score: 5,
        security_status: 'Safe',
        click_history: [
          { date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], clicks: 28 },
          { date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], clicks: 45 },
          { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], clicks: 39 },
          { date: new Date().toISOString().split('T')[0], clicks: 30 }
        ]
      };
      addStoredLink(starterLink);
    }
  }, []);

  const handleOpenQr = (url: string) => {
    setQrModalData({ isOpen: true, url });
  };

  const handleCloseQr = () => {
    setQrModalData({ isOpen: false, url: '' });
  };

  // If visiting /s/:alias
  if (redirectAlias) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <header className="w-full bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={() => {
                setRedirectAlias(null);
                window.history.pushState({}, '', '/');
              }}
              className="font-bold text-lg text-slate-900 tracking-tight"
            >
              Link<span className="text-blue-600">Pulse</span>
            </button>
            <span className="text-xs text-slate-500 font-mono">Security Gateway Intercept</span>
          </div>
        </header>

        <main className="flex-1">
          <RedirectInterstitial
            alias={redirectAlias}
            onGoHome={() => {
              setRedirectAlias(null);
              window.history.pushState({}, '', '/');
            }}
          />
        </main>

        <footer className="w-full border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-400">
          LinkPulse · AI URL Shortener & Link Security Platform
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
      {/* Compact Sticky Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenChromeModal={() => setIsChromeModalOpen(true)}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        backendStatus={backendStatus}
      />

      {/* Main Workspace Area (Direct single-screen workspace switching) */}
      <main className="flex-1 pb-12">
        {currentTab === 'shorten' && (
          <ShortenWorkspace
            onOpenQrModal={handleOpenQr}
            onLinkCreated={() => {
              // auto sync link states
            }}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsWorkspace
            onOpenQrModal={handleOpenQr}
            onNavigateToShorten={() => setCurrentTab('shorten')}
          />
        )}

        {currentTab === 'security' && (
          <SecurityWorkspace />
        )}
      </main>

      {/* Clean, Quiet Footer per Design Constitution */}
      <footer className="w-full border-t border-slate-200 bg-white py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">LinkPulse</span>
            <span aria-hidden="true">·</span>
            <span>AI URL Shortener & Link Security Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBackendModalOpen(true)}
              className="hover:text-slate-800 transition-colors"
            >
              API Configuration
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsChromeModalOpen(true)}
              className="hover:text-slate-800 transition-colors"
            >
              Chrome Extension Guide
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ChromeExtensionModal
        isOpen={isChromeModalOpen}
        onClose={() => setIsChromeModalOpen(false)}
      />

      <BackendSettingsModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        status={backendStatus}
        onStatusUpdated={setBackendStatus}
      />

      <QrCodeModal
        isOpen={qrModalData.isOpen}
        onClose={handleCloseQr}
        url={qrModalData.url}
      />
    </div>
  );
}
