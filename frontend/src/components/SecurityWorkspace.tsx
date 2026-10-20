import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search,
  Loader2,
  Info,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Server
} from 'lucide-react';
import { ScanResult, ScanClassification } from '../types';
import { scanUrl } from '../services/api';
import { getStoredScans } from '../services/storage';

interface SecurityWorkspaceProps {
  onScanComplete?: (result: ScanResult) => void;
}

export const SecurityWorkspace: React.FC<SecurityWorkspaceProps> = ({ onScanComplete }) => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBackendSource, setIsBackendSource] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanResult[]>(() => getStoredScans());

  const handleScan = async (targetUrl?: string) => {
    const raw = (targetUrl || urlInput).trim();
    if (!raw) {
      setErrorMessage('Please enter a URL to inspect.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { result, isBackend, errorNotice } = await scanUrl(raw);
      setScanResult(result);
      setIsBackendSource(isBackend);
      setRecentScans(getStoredScans());
      if (onScanComplete) {
        onScanComplete(result);
      }
      if (errorNotice) {
        console.info(errorNotice);
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Scan inspection failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (sample: string) => {
    setUrlInput(sample);
    handleScan(sample);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (score >= 30) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-rose-600';
    if (score >= 30) return 'bg-amber-500';
    return 'bg-emerald-600';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Workspace Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          AI & Heuristic Link Security Scanner
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Analyze suspicious links, verify host credentials, and detect phishing vectors before users click.
        </p>
      </div>

      {/* Main Scan Input Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScan();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="security-url-input" className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Target URL for Inspection
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  id="security-url-input"
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/login-verification"
                  className="w-full pl-3.5 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !urlInput.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-md shadow-xs transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Scan URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick preset tests */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-500 font-medium">Try testing:</span>
            <button
              type="button"
              onClick={() => loadSample('https://github.com/explore')}
              className="text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
            >
              Legitimate URL (GitHub)
            </button>
            <button
              type="button"
              onClick={() => loadSample('http://192.168.1.1/admin-login/verify')}
              className="text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
            >
              Raw IP Host (HTTP)
            </button>
            <button
              type="button"
              onClick={() => loadSample('http://paypal.account-verify.security-update.xyz/login')}
              className="text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
            >
              Phishing Pattern (.xyz)
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Scan Results Panel */}
        {scanResult && (
          <div className="mt-6 pt-5 border-t border-slate-200 space-y-4">
            {/* Top Classification Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-md">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${getScoreColor(scanResult.risk_score)}`}>
                  {scanResult.classification === 'Malicious' ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : scanResult.classification === 'Suspicious' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">
                      Classification: {scanResult.classification}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      (Score: {scanResult.risk_score}/100)
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-mono truncate max-w-md mt-0.5" title={scanResult.url}>
                    {scanResult.url}
                  </div>
                </div>
              </div>

              {/* Engine Source Badge */}
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 shrink-0">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Engine: {isBackendSource ? 'FastAPI /scan/ Endpoint' : 'Local Heuristic Engine'}</span>
              </div>
            </div>

            {/* Risk Gauge Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Threat Gauge</span>
                <span className="font-mono tabular-nums font-semibold text-slate-800">
                  {scanResult.risk_score} / 100 Risk Index
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  style={{ width: `${scanResult.risk_score}%` }}
                  className={`h-full transition-all duration-300 ${getScoreBarColor(scanResult.risk_score)}`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                <span>0 (Safe)</span>
                <span>30 (Suspicious Threshold)</span>
                <span>70 (Malicious Threshold)</span>
                <span>100</span>
              </div>
            </div>

            {/* Short explanation of risk signals detected */}
            <div className="p-4 bg-white border border-slate-200 rounded-md">
              <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-2">
                Risk Signals Detected ({scanResult.risk_signals.length})
              </h2>
              <ul className="space-y-2">
                {scanResult.risk_signals.map((signal, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendation about what the user should do next */}
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-semibold text-blue-900">
                    Recommended Action
                  </h2>
                  <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
                    {scanResult.recommendation}
                  </p>
                </div>
              </div>
            </div>

            {/* Mandatory Disclaimer from requirements */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">Security Disclaimer:</span> Scan results reflect algorithmic heuristic evaluations and threat intelligence heuristics. A <span className="font-medium text-slate-700">Safe</span> classification does not guarantee that a destination website is completely harmless or free from zero-day compromises. Always exercise vigilance before entering credentials or executing downloads.
            </div>
          </div>
        )}
      </div>

      {/* Recent Scans History */}
      {recentScans.length > 0 && (
        <div className="mt-6 bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-3">
            Recent Scanned Targets ({recentScans.length})
          </div>
          <div className="divide-y divide-slate-100">
            {recentScans.slice(0, 5).map((scan, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setUrlInput(scan.url);
                  setScanResult(scan);
                }}
                className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="font-mono text-slate-800 truncate">{scan.url}</div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(scan.scan_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {scan.risk_signals.length} signals
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-semibold font-mono tabular-nums text-[11px] ${
                    scan.risk_score >= 70 ? 'text-rose-600' : scan.risk_score >= 30 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {scan.classification} ({scan.risk_score})
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
