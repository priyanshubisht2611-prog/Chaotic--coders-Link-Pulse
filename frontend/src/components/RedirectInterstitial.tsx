import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, ExternalLink, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { ShortenedLink } from '../types';
import { getStoredLinks, recordLinkClick } from '../services/storage';
import { analyzeUrlLocally } from '../services/securityScanner';

interface RedirectInterstitialProps {
  alias: string;
  onGoHome: () => void;
}

export const RedirectInterstitial: React.FC<RedirectInterstitialProps> = ({ alias, onGoHome }) => {
  const [link, setLink] = useState<ShortenedLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number>(3);
  const [proceedDirectly, setProceedDirectly] = useState(false);

  useEffect(() => {
    const links = getStoredLinks();
    const found = links.find(l => l.alias.toLowerCase() === alias.toLowerCase());

    if (found) {
      setLink(found);
      recordLinkClick(found.alias);

      // If safe, start auto redirect countdown
      if (found.security_status === 'Safe' || !found.security_status) {
        setProceedDirectly(true);
      }
    } else {
      // Not found locally
      setLink(null);
    }
    setLoading(false);
  }, [alias]);

  useEffect(() => {
    if (!proceedDirectly || !link) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      window.location.href = link.original_url;
    }
  }, [proceedDirectly, countdown, link]);

  const handleProceed = () => {
    if (!link) return;
    window.location.href = link.original_url;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
        <p className="text-xs text-slate-500">Checking link safety...</p>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-6 text-center shadow-xs">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Short Link Not Found</h2>
          <p className="text-xs text-slate-600 mt-1 mb-5">
            The link with alias <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">/s/{alias}</code> does not exist or has expired.
          </p>
          <button
            onClick={onGoHome}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Go to LinkPulse Home
          </button>
        </div>
      </div>
    );
  }

  const isMalicious = link.security_status === 'Malicious';
  const isSuspicious = link.security_status === 'Suspicious';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        {/* Status header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            isMalicious
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : isSuspicious
              ? 'bg-amber-50 text-amber-600 border border-amber-200'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          }`}>
            {isMalicious ? <ShieldAlert className="w-5 h-5" /> : isSuspicious ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {isMalicious
                ? 'LinkPulse Security Intercept: Malicious Link'
                : isSuspicious
                ? 'LinkPulse Security Advisory: Suspicious Link'
                : 'Verified Destination'}
            </h2>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              Target: {link.short_url}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
            <div className="text-[11px] uppercase tracking-wide font-medium text-slate-400">
              Destination URL
            </div>
            <div className="text-xs font-mono text-slate-800 break-all mt-1">
              {link.original_url}
            </div>
          </div>

          {isMalicious ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-900 leading-relaxed">
              <span className="font-bold">Warning:</span> This link has been identified with high-confidence malicious or credential phishing signatures. Navigating to this page may compromise your security.
            </div>
          ) : isSuspicious ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Caution:</span> Unusual characteristics (unencrypted protocol, atypical TLD, or deceptive parameters) were detected on this destination.
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900">
              {proceedDirectly ? (
                <span>Redirecting automatically in <strong className="font-mono">{countdown}</strong> seconds...</span>
              ) : (
                <span>Clean safety score. Ready to proceed to verified site.</span>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onGoHome}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            Cancel & Return Home
          </button>

          <button
            onClick={handleProceed}
            className={`px-4 py-2 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
              isMalicious
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <span>Proceed to Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
