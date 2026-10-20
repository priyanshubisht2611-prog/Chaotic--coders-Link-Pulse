import { ScanResult, ShortenedLink, AnalyticsSummary, ClickTrendPoint, BackendStatus } from '../types';
import { analyzeUrlLocally } from './securityScanner';
import {
  getStoredApiBaseUrl,
  getStoredLinks,
  addStoredLink,
  computeAnalytics,
  addStoredScan,
  getStoredScans
} from './storage';
import { generateQrDataUrl } from './qr';

export async function checkBackendHealth(customBaseUrl?: string): Promise<BackendStatus> {
  const baseUrl = (customBaseUrl || getStoredApiBaseUrl()).replace(/\/+$/, '');
  const now = new Date().toISOString();

  if (!baseUrl) {
    return {
      isConnected: false,
      baseUrl: '',
      lastChecked: now,
      errorMessage: 'No API base URL configured'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    // Try standard FastAPI health / root / docs endpoints
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal
    }).catch(() =>
      fetch(`${baseUrl}/`, {
        method: 'GET',
        signal: controller.signal
      })
    );

    clearTimeout(timeoutId);

    if (response && response.ok) {
      let data: Record<string, unknown> = {};
      try {
        data = await response.json();
      } catch {
        // ok if plain text
      }
      return {
        isConnected: true,
        baseUrl,
        version: typeof data.version === 'string' ? data.version : 'FastAPI v0.110+',
        lastChecked: now
      };
    } else if (response && response.status < 500) {
      // Endpoint exists (e.g. 404 or 405 on root is still an active HTTP server!)
      return {
        isConnected: true,
        baseUrl,
        version: 'FastAPI Active',
        lastChecked: now
      };
    }

    return {
      isConnected: false,
      baseUrl,
      lastChecked: now,
      errorMessage: `Server responded with HTTP ${response ? response.status : 'error'}`
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection refused / network offline';
    return {
      isConnected: false,
      baseUrl,
      lastChecked: now,
      errorMessage: `Could not reach ${baseUrl} (${message})`
    };
  }
}

export async function scanUrl(url: string): Promise<{ result: ScanResult; isBackend: boolean; errorNotice?: string }> {
  const baseUrl = getStoredApiBaseUrl().replace(/\/+$/, '');

  if (baseUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Connect to FastAPI /scan/ endpoint as specified in requirements
      const response = await fetch(`${baseUrl}/scan/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Normalize FastAPI response
        const normalized: ScanResult = {
          url: data.url || url,
          risk_score: typeof data.risk_score === 'number' ? data.risk_score : (data.score ?? 10),
          classification: (data.classification || (data.risk_score > 69 ? 'Malicious' : data.risk_score > 29 ? 'Suspicious' : 'Safe')),
          risk_signals: Array.isArray(data.risk_signals) ? data.risk_signals : (data.signals || ['FastAPI security model analyzed target']),
          recommendation: data.recommendation || 'Verified by LinkPulse security engine.',
          scan_timestamp: data.scan_timestamp || new Date().toISOString(),
          details: data.details
        };
        addStoredScan(normalized);
        return { result: normalized, isBackend: true };
      }
    } catch {
      // Backend unavailable; seamlessly proceed to deep client heuristic scan
    }
  }

  // Fallback to local heuristic scanner
  const localResult = analyzeUrlLocally(url);
  addStoredScan(localResult);
  return {
    result: localResult,
    isBackend: false,
    errorNotice: baseUrl ? `FastAPI backend at ${baseUrl} is unavailable. LinkPulse performed client-side heuristic inspection.` : undefined
  };
}

export async function shortenUrl(
  originalUrl: string,
  customAlias?: string
): Promise<{ link: ShortenedLink; isBackend: boolean; errorNotice?: string }> {
  const baseUrl = getStoredApiBaseUrl().replace(/\/+$/, '');
  const cleanOriginal = originalUrl.trim();
  const alias = (customAlias || Math.random().toString(36).substring(2, 8)).trim();

  if (baseUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(`${baseUrl}/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cleanOriginal,
          custom_alias: customAlias || undefined
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const shortUrl = data.short_url || `${window.location.origin}/s/${data.alias || alias}`;
        const qrCode = data.qr_code || await generateQrDataUrl(shortUrl);

        const newLink: ShortenedLink = {
          id: data.id || `lnk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          original_url: data.original_url || cleanOriginal,
          short_url: shortUrl,
          alias: data.alias || alias,
          created_at: data.created_at || new Date().toISOString(),
          clicks: data.clicks || 0,
          status: 'active',
          security_score: data.security_score,
          security_status: data.security_status,
          qr_code: qrCode
        };

        addStoredLink(newLink);
        return { link: newLink, isBackend: true };
      }
    } catch {
      // Backend unavailable, fallback
    }
  }

  // Local creation fallback
  const scan = analyzeUrlLocally(cleanOriginal);
  const shortUrl = `${window.location.origin}/s/${alias}`;
  let qrCode = '';
  try {
    qrCode = await generateQrDataUrl(shortUrl);
  } catch {
    // ignore
  }

  const localLink: ShortenedLink = {
    id: `lnk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    original_url: cleanOriginal,
    short_url: shortUrl,
    alias,
    created_at: new Date().toISOString(),
    clicks: 0,
    status: 'active',
    security_score: scan.risk_score,
    security_status: scan.classification,
    qr_code: qrCode,
    click_history: []
  };

  addStoredLink(localLink);
  return {
    link: localLink,
    isBackend: false,
    errorNotice: baseUrl ? `FastAPI backend at ${baseUrl} is unavailable. Link saved locally.` : undefined
  };
}

export async function fetchAnalyticsData(days: number = 30): Promise<{
  summary: AnalyticsSummary;
  trends: ClickTrendPoint[];
  links: ShortenedLink[];
  isBackend: boolean;
}> {
  const baseUrl = getStoredApiBaseUrl().replace(/\/+$/, '');

  if (baseUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${baseUrl}/analytics?days=${days}`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          summary: data.summary || {
            total_links: (data.links || []).length,
            active_links: (data.links || []).filter((l: ShortenedLink) => l.status === 'active').length,
            total_clicks: (data.links || []).reduce((acc: number, l: ShortenedLink) => acc + (l.clicks || 0), 0)
          },
          trends: data.trends || [],
          links: data.links || [],
          isBackend: true
        };
      }
    } catch {
      // fallback
    }
  }

  // Local storage analytics
  const stored = getStoredLinks();
  const { summary, trends } = computeAnalytics(stored, days);
  return {
    summary,
    trends,
    links: stored,
    isBackend: false
  };
}

export async function bulkShortenUrls(
  items: { original_url: string; custom_alias?: string }[]
): Promise<{
  results: { original_url: string; short_url: string; alias: string; status: 'success' | 'error'; error?: string }[];
  isBackend: boolean;
}> {
  const baseUrl = getStoredApiBaseUrl().replace(/\/+$/, '');

  if (baseUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`${baseUrl}/bulk-shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: items }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // save any generated links
        if (Array.isArray(data.results)) {
          for (const item of data.results) {
            if (item.status === 'success' && item.short_url) {
              addStoredLink({
                id: `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                original_url: item.original_url,
                short_url: item.short_url,
                alias: item.alias,
                created_at: new Date().toISOString(),
                clicks: 0,
                status: 'active'
              });
            }
          }
          return { results: data.results, isBackend: true };
        }
      }
    } catch {
      // fallback to sequential local shorten
    }
  }

  // Local sequential shortening
  const results = [];
  for (const item of items) {
    try {
      const { link } = await shortenUrl(item.original_url, item.custom_alias);
      results.push({
        original_url: item.original_url,
        short_url: link.short_url,
        alias: link.alias,
        status: 'success' as const
      });
    } catch (e) {
      results.push({
        original_url: item.original_url,
        short_url: '',
        alias: '',
        status: 'error' as const,
        error: e instanceof Error ? e.message : 'Failed to shorten'
      });
    }
  }

  return { results, isBackend: false };
}
