import { ShortenedLink, ScanResult, AnalyticsSummary, ClickTrendPoint } from '../types';

const STORAGE_KEYS = {
  LINKS: 'linkpulse_shortened_links',
  SCANS: 'linkpulse_url_scans',
  API_BASE_URL: 'linkpulse_api_base_url'
};

export function getStoredApiBaseUrl(): string {
  const custom = localStorage.getItem(STORAGE_KEYS.API_BASE_URL);
  if (custom !== null) return custom;
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
}

export function setStoredApiBaseUrl(url: string): void {
  localStorage.setItem(STORAGE_KEYS.API_BASE_URL, url.trim());
}

export function getStoredLinks(): ShortenedLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LINKS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse links from localStorage', e);
    return [];
  }
}

export function saveStoredLinks(links: ShortenedLink[]): void {
  localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
}

export function addStoredLink(newLink: ShortenedLink): ShortenedLink[] {
  const links = getStoredLinks();
  // Filter out any link with same alias if present
  const updated = [newLink, ...links.filter(l => l.alias !== newLink.alias)];
  saveStoredLinks(updated);
  return updated;
}

export function recordLinkClick(alias: string): ShortenedLink | null {
  const links = getStoredLinks();
  const index = links.findIndex(l => l.alias === alias);
  if (index === -1) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const link = links[index];
  link.clicks += 1;

  if (!link.click_history) {
    link.click_history = [];
  }

  const historyEntry = link.click_history.find(h => h.date === todayStr);
  if (historyEntry) {
    historyEntry.clicks += 1;
  } else {
    link.click_history.push({ date: todayStr, clicks: 1 });
  }

  links[index] = link;
  saveStoredLinks(links);
  return link;
}

export function deleteStoredLink(id: string): ShortenedLink[] {
  const links = getStoredLinks().filter(l => l.id !== id);
  saveStoredLinks(links);
  return links;
}

export function computeAnalytics(links: ShortenedLink[], daysFilter: number = 30): {
  summary: AnalyticsSummary;
  trends: ClickTrendPoint[];
} {
  const total_links = links.length;
  const active_links = links.filter(l => l.status === 'active').length;
  const total_clicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);

  // Generate trend line for the last `daysFilter` days
  const now = new Date();
  const datesMap: Record<string, number> = {};

  for (let i = daysFilter - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    datesMap[dateStr] = 0;
  }

  links.forEach(link => {
    if (link.click_history && Array.isArray(link.click_history)) {
      link.click_history.forEach(entry => {
        if (datesMap[entry.date] !== undefined) {
          datesMap[entry.date] += entry.clicks;
        }
      });
    }
  });

  const trends: ClickTrendPoint[] = Object.entries(datesMap).map(([date, clicks]) => ({
    date,
    clicks
  }));

  return {
    summary: {
      total_links,
      active_links,
      total_clicks
    },
    trends
  };
}

export function getStoredScans(): ScanResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCANS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addStoredScan(scan: ScanResult): ScanResult[] {
  const scans = getStoredScans();
  const updated = [scan, ...scans.slice(0, 19)]; // Keep latest 20 scans
  localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(updated));
  return updated;
}
