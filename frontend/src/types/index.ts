export type ScanClassification = 'Safe' | 'Suspicious' | 'Malicious';

export interface ScanDetails {
  domain: string;
  protocol: string;
  hasHttps: boolean;
  isIpAddress: boolean;
  subdomainCount: number;
  suspiciousTld: boolean;
  containsSuspiciousKeywords: boolean;
  entropyScore: number;
  urlLength: number;
  hasPunycode: boolean;
}

export interface ScanResult {
  url: string;
  risk_score: number; // 0 to 100
  classification: ScanClassification;
  risk_signals: string[];
  recommendation: string;
  scan_timestamp: string;
  details?: ScanDetails;
}

export interface ShortenedLink {
  id: string;
  original_url: string;
  short_url: string;
  alias: string;
  created_at: string;
  clicks: number;
  status: 'active' | 'expired';
  security_score?: number;
  security_status?: ScanClassification;
  qr_code?: string;
  click_history?: { date: string; clicks: number }[];
}

export interface AnalyticsSummary {
  total_links: number;
  active_links: number;
  total_clicks: number;
}

export interface ClickTrendPoint {
  date: string;
  clicks: number;
}

export interface BulkShortenItem {
  id: string;
  original_url: string;
  custom_alias?: string;
  short_url?: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export interface BackendStatus {
  isConnected: boolean;
  baseUrl: string;
  version?: string;
  lastChecked: string | null;
  errorMessage?: string;
}
