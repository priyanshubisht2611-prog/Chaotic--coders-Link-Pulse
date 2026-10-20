import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  QrCode,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Upload,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
  Download
} from 'lucide-react';
import { ShortenedLink } from '../types';
import { shortenUrl, bulkShortenUrls } from '../services/api';
import { recordLinkClick } from '../services/storage';

interface ShortenWorkspaceProps {
  onOpenQrModal: (url: string) => void;
  onLinkCreated: (link: ShortenedLink) => void;
}

export const ShortenWorkspace: React.FC<ShortenWorkspaceProps> = ({
  onOpenQrModal,
  onLinkCreated
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultLink, setResultLink] = useState<ShortenedLink | null>(null);
  const [copied, setCopied] = useState(false);

  // Bulk CSV Mode
  const [showBulkMode, setShowBulkMode] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{
    original_url: string;
    short_url: string;
    alias: string;
    status: 'success' | 'error';
    error?: string;
  }[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUrl = urlInput.trim();
    if (!targetUrl) {
      setErrorMessage('Please enter a valid URL.');
      return;
    }

    try {
      new URL(targetUrl.startsWith('http://') || targetUrl.startsWith('https://') ? targetUrl : `https://${targetUrl}`);
    } catch {
      setErrorMessage('Please provide a valid URL format (e.g. https://example.com/page).');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { link, errorNotice } = await shortenUrl(targetUrl, customAlias.trim() || undefined);
      setResultLink(link);
      onLinkCreated(link);
      if (errorNotice) {
        console.info(errorNotice);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate shortened link.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleTestClick = (link: ShortenedLink) => {
    recordLinkClick(link.alias);
    window.open(link.original_url, '_blank', 'noopener,noreferrer');
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return;

      // Extract URLs from CSV
      const parsedItems: { original_url: string; custom_alias?: string }[] = [];
      const isHeader = lines[0].toLowerCase().includes('url');
      const dataLines = isHeader ? lines.slice(1) : lines;

      for (const line of dataLines) {
        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        const original = parts[0];
        const alias = parts[1];
        if (original && (original.startsWith('http') || original.includes('.'))) {
          parsedItems.push({
            original_url: original,
            custom_alias: alias || undefined
          });
        }
      }

      if (parsedItems.length === 0) {
        setErrorMessage('No valid URLs found in the uploaded CSV.');
        return;
      }

      setBulkLoading(true);
      try {
        const res = await bulkShortenUrls(parsedItems);
        setBulkResults(res.results);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to process CSV file.');
      } finally {
        setBulkLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const downloadBulkCsv = () => {
    if (!bulkResults) return;
    const header = 'Original URL,Short URL,Alias,Status\n';
    const rows = bulkResults.map(r => `"${r.original_url}","${r.short_url}","${r.alias}","${r.status}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkpulse_shortened_batch_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Workspace Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Shorten a link. Keep it safer.
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Transform long, cumbersome web addresses into fast, trackable links verified with safety inspection.
        </p>
      </div>

      {/* Main Shortener Form Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url-input" className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Destination URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  id="url-input"
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste your long URL here"
                  className="w-full pl-3.5 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400"
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
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>Shorten URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Expandable Advanced Options Bar */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Advanced options</span>
              {showAdvanced ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="custom-alias" className="block text-xs font-medium text-slate-700 mb-1">
                    Custom Alias (optional)
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-md text-xs text-slate-500 font-mono">
                      /s/
                    </span>
                    <input
                      id="custom-alias"
                      type="text"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                      placeholder="e.g. spring-sale-2026"
                      className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-r-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Letters, numbers, hyphens, and underscores only.
                  </p>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Pre-Scan Security Check</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Target addresses are automatically screened against known phishing and deceptive domain patterns.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Generated Result Area */}
        {resultLink && (
          <div className="mt-5 pt-5 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
              Shortened Link Created
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={resultLink.short_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-semibold font-mono text-blue-600 hover:text-blue-800 hover:underline truncate"
                    >
                      {resultLink.short_url}
                    </a>
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5" title={resultLink.original_url}>
                    Destination: {resultLink.original_url}
                  </div>
                </div>

                {/* Actions: Copy & QR */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(resultLink.short_url)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-300 shadow-xs transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onOpenQrModal(resultLink.short_url)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-300 shadow-xs transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5 text-slate-600" />
                    <span>QR Code</span>
                  </button>

                  <button
                    onClick={() => handleTestClick(resultLink)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    title="Simulate click & visit destination"
                  >
                    <span>Visit</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Unboxed Metadata per design constitution */}
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200/80">
                <span className="flex items-center gap-1">
                  {resultLink.security_status === 'Malicious' ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>Status: {resultLink.security_status || 'Inspected'}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>Created {new Date(resultLink.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{resultLink.clicks} clicks recorded</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk CSV Upload Section */}
      <div className="mt-6 border border-slate-200 bg-white rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Bulk URL CSV Shortening
            </h2>
          </div>
          <button
            onClick={() => setShowBulkMode(!showBulkMode)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showBulkMode ? 'Hide Bulk Options' : 'Upload CSV'}
          </button>
        </div>

        {showBulkMode && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
            <p className="text-xs text-slate-600">
              Upload a comma-separated <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">.csv</code> file with URLs (first column) and optional custom aliases (second column).
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
                <Upload className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-700">
                  {bulkFile ? bulkFile.name : 'Choose CSV File from Device'}
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
              </label>

              {bulkResults && bulkResults.length > 0 && (
                <button
                  onClick={downloadBulkCsv}
                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Batch CSV</span>
                </button>
              )}
            </div>

            {bulkLoading && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Processing batch links through LinkPulse engine...</span>
              </div>
            )}

            {/* Bulk Results Table */}
            {bulkResults && bulkResults.length > 0 && (
              <div className="mt-3 border border-slate-200 rounded-md overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 flex justify-between">
                  <span>Batch Output ({bulkResults.length} links processed)</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {bulkResults.map((item, idx) => (
                    <div key={idx} className="px-3 py-2 text-xs flex items-center justify-between gap-2 hover:bg-slate-50/60">
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-blue-600 truncate">{item.short_url || 'Failed'}</div>
                        <div className="text-slate-400 truncate">{item.original_url}</div>
                      </div>
                      <div className="shrink-0">
                        {item.status === 'success' ? (
                          <span className="text-[11px] text-emerald-700 font-medium">Ready</span>
                        ) : (
                          <span className="text-[11px] text-rose-600 font-medium">Error</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
