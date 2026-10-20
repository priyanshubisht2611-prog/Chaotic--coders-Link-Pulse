import React, { useState } from 'react';
import { X, Server, CheckCircle2, AlertTriangle, RefreshCw, Terminal, Copy, Check } from 'lucide-react';
import { BackendStatus } from '../types';
import { checkBackendHealth } from '../services/api';
import { setStoredApiBaseUrl } from '../services/storage';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: BackendStatus;
  onStatusUpdated: (newStatus: BackendStatus) => void;
}

export const BackendSettingsModal: React.FC<BackendSettingsModalProps> = ({
  isOpen,
  onClose,
  status,
  onStatusUpdated
}) => {
  const [urlInput, setUrlInput] = useState(status.baseUrl || 'http://localhost:8000');
  const [testing, setTesting] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const testCommand = 'uvicorn backend.main:app --reload --port 8000';

  const handleTestConnection = async () => {
    setTesting(true);
    setStoredApiBaseUrl(urlInput);
    const newStatus = await checkBackendHealth(urlInput);
    onStatusUpdated(newStatus);
    setTesting(false);
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(testCommand).then(() => {
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              FastAPI Backend Integration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Current Status Box */}
          <div className={`p-3 rounded-md border flex items-start gap-3 ${
            status.isConnected
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            {status.isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <div className="font-semibold">
                {status.isConnected ? 'FastAPI Backend Online' : 'FastAPI Server Offline / Unreachable'}
              </div>
              <div className="mt-1 text-slate-600">
                {status.isConnected
                  ? `Active connection established to ${status.baseUrl}`
                  : `Using client-side heuristic inspection and persistent local storage. All shortening, scanning, and analytics features remain active.`}
              </div>
            </div>
          </div>

          {/* Config URL Field */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              API Base URL (<code className="font-mono text-[11px]">VITE_API_BASE_URL</code>)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Pinging...' : 'Test'}</span>
              </button>
            </div>
          </div>

          {/* Local FastAPI Launch Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                Run FastAPI Locally:
              </span>
              <button
                onClick={copyCommand}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-[11px]"
              >
                {copiedCmd ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="font-mono text-[11px] bg-slate-900 text-slate-200 p-2 rounded overflow-x-auto">
              {testCommand}
            </pre>
            <p className="text-[11px] text-slate-500">
              The reference FastAPI backend file is ready at <code className="font-mono text-slate-700">backend/main.py</code>.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
