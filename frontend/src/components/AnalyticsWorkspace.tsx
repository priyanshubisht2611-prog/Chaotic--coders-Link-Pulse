import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Search,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { ShortenedLink, AnalyticsSummary, ClickTrendPoint } from '../types';
import { fetchAnalyticsData } from '../services/api';
import { recordLinkClick } from '../services/storage';

interface AnalyticsWorkspaceProps {
  onOpenQrModal: (url: string) => void;
  onNavigateToShorten: () => void;
}

export const AnalyticsWorkspace: React.FC<AnalyticsWorkspaceProps> = ({
  onOpenQrModal,
  onNavigateToShorten
}) => {
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary>({ total_links: 0, active_links: 0, total_clicks: 0 });
  const [trends, setTrends] = useState<ClickTrendPoint[]>([]);
  const [links, setLinks] = useState<ShortenedLink[]>([]);
  const [copiedAlias, setCopiedAlias] = useState<string | null>(null);

  const loadData = async (days: number) => {
    setLoading(true);
    try {
      const res = await fetchAnalyticsData(days);
      setSummary(res.summary);
      setTrends(res.trends);
      setLinks(res.links);
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(daysFilter);
  }, [daysFilter]);

  const handleCopy = (alias: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedAlias(alias);
      setTimeout(() => setCopiedAlias(null), 2000);
    });
  };

  const handleVisit = (link: ShortenedLink) => {
    recordLinkClick(link.alias);
    window.open(link.original_url, '_blank', 'noopener,noreferrer');
    // Refresh local click counts
    loadData(daysFilter);
  };

  const exportCsv = () => {
    if (links.length === 0) return;
    const header = 'ID,Short URL,Original URL,Alias,Created At,Clicks,Status,Security Status\n';
    const rows = links.map(l =>
      `"${l.id}","${l.short_url}","${l.original_url}","${l.alias}","${l.created_at}",${l.clicks},"${l.status}","${l.security_status || 'Unchecked'}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkpulse_analytics_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter links by search query
  const filteredLinks = links.filter(l =>
    l.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.original_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.short_url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate highest click count for trend chart scaling
  const maxTrendClicks = Math.max(5, ...trends.map(t => t.clicks));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Traffic & Link Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time click tracking, historical referral volumes, and link performance metrics.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2.5">
          {/* Date Range Segmented Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-md border border-slate-200">
            <button
              onClick={() => setDaysFilter(7)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                daysFilter === 7 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDaysFilter(30)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                daysFilter === 30 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDaysFilter(90)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                daysFilter === 90 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90 Days
            </button>
          </div>

          <button
            onClick={exportCsv}
            disabled={links.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-200 rounded-md shadow-xs transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Total Shortened Links
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1.5">
            {summary.total_links.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Registered links in repository
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Active Links
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1.5">
            {summary.active_links.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Resolving and ready for traffic
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Total Click Volume
          </div>
          <div className="text-2xl font-bold text-blue-600 font-mono tabular-nums mt-1.5">
            {summary.total_clicks.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Verified visitor redirections
          </div>
        </div>
      </div>

      {/* Click Trend Chart */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Click Volume Trend ({daysFilter} Days)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Max day: <span className="font-mono tabular-nums font-semibold text-slate-800">{Math.max(0, ...trends.map(t => t.clicks))}</span> clicks
          </span>
        </div>

        {/* Clean responsive bar chart */}
        <div className="mt-4 pt-2">
          {trends.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-xs text-slate-400">
              No trend data available for this range
            </div>
          ) : (
            <div>
              <div className="h-40 flex items-end gap-1 sm:gap-1.5 pb-2">
                {trends.map((pt, idx) => {
                  const heightPercent = maxTrendClicks > 0 ? (pt.clicks / maxTrendClicks) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10 font-mono">
                        {pt.date}: {pt.clicks} clicks
                      </div>
                      <div
                        style={{ height: `${Math.max(4, heightPercent)}%` }}
                        className={`w-full rounded-t transition-all ${
                          pt.clicks > 0
                            ? 'bg-blue-600 group-hover:bg-blue-700'
                            : 'bg-slate-100'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                <span>{trends[0]?.date}</span>
                <span>{trends[Math.floor(trends.length / 2)]?.date}</span>
                <span>{trends[trends.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Links Data Table Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {/* Table Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by alias or destination..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-mono tabular-nums text-slate-800">{filteredLinks.length}</span> of <span className="font-mono tabular-nums text-slate-800">{links.length}</span> links
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-slate-400" />
            Loading link analytics...
          </div>
        ) : filteredLinks.length === 0 ? (
          /* Empty State as requested in specifications */
          <div className="p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              {searchQuery ? 'No matching links found' : 'No analytics data yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {searchQuery
                ? 'Try revising your search term to locate the shortened link.'
                : 'Create your first shortened link to begin recording visitor clicks and geographic referrals.'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNavigateToShorten}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create First Link</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Short Link</th>
                  <th className="py-2.5 px-4">Original Destination</th>
                  <th className="py-2.5 px-4 text-center">Security</th>
                  <th className="py-2.5 px-4 text-right">Clicks</th>
                  <th className="py-2.5 px-4 text-right">Created</th>
                  <th className="py-2.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Short URL */}
                    <td className="py-3 px-4 font-mono font-medium text-blue-600">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[160px]">{link.short_url}</span>
                      </div>
                    </td>

                    {/* Original Destination */}
                    <td className="py-3 px-4 text-slate-600 max-w-[240px]">
                      <div className="truncate" title={link.original_url}>
                        {link.original_url}
                      </div>
                    </td>

                    {/* Security Classification */}
                    <td className="py-3 px-4 text-center">
                      {link.security_status === 'Malicious' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span>Malicious</span>
                        </span>
                      ) : link.security_status === 'Suspicious' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          <span>Suspicious</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Safe</span>
                        </span>
                      )}
                    </td>

                    {/* Click Count */}
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {link.clicks.toLocaleString()}
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 text-right text-slate-500 font-mono tabular-nums whitespace-nowrap">
                      {new Date(link.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleCopy(link.alias, link.short_url)}
                          title="Copy link"
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        >
                          {copiedAlias === link.alias ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => onOpenQrModal(link.short_url)}
                          title="View QR Code"
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleVisit(link)}
                          title="Simulate click & visit destination"
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
