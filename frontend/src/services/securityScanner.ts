import { ScanResult, ScanClassification, ScanDetails } from '../types';

const SUSPICIOUS_TLDS = new Set([
  'xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'work', 'click', 'buzz',
  'fit', 'loan', 'cam', 'country', 'stream', 'download', 'racing', 'win'
]);

const PHISHING_KEYWORDS = [
  'login', 'verify', 'account', 'banking', 'secure', 'wallet', 'signin',
  'authenticate', 'recovery', 'password', 'paypal', 'appleid', 'microsoft-verify',
  'support-desk', 'crypto-claim', 'airdrop-claim', 'metamask', 'binance-auth'
];

function calculateEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;
  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(2));
}

export function analyzeUrlLocally(rawUrl: string): ScanResult {
  let urlObj: URL;
  try {
    const formatted = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : `https://${rawUrl}`;
    urlObj = new URL(formatted);
  } catch {
    return {
      url: rawUrl,
      risk_score: 85,
      classification: 'Malicious',
      risk_signals: [
        'Malformed URL syntax unable to be parsed by standard RFC 3986 parsers',
        'Potential obfuscated payload or protocol smuggling attempt'
      ],
      recommendation: 'Do not access this target. The string structure does not conform to valid web standards.',
      scan_timestamp: new Date().toISOString(),
    };
  }

  const hostname = urlObj.hostname.toLowerCase();
  const pathname = urlObj.pathname.toLowerCase();
  const fullHref = urlObj.href.toLowerCase();
  const searchParams = urlObj.search.toLowerCase();

  const signals: string[] = [];
  let score = 5; // Base minimal score

  // 1. Protocol check
  const isHttps = urlObj.protocol === 'https:';
  if (!isHttps) {
    score += 20;
    signals.push('Insecure plaintext protocol (HTTP instead of HTTPS)');
  }

  // 2. IP address host
  const isIpHost = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith('[') || /^[0-9a-fA-F:]+$/.test(hostname);
  if (isIpHost) {
    score += 45;
    signals.push('Raw IP address host detected instead of registered domain name');
  }

  // 3. TLD analysis
  const parts = hostname.split('.');
  const tld = parts.length > 1 ? parts[parts.length - 1] : '';
  const isSuspiciousTld = SUSPICIOUS_TLDS.has(tld);
  if (isSuspiciousTld) {
    score += 25;
    signals.push(`High-abuse top-level domain (.${tld}) commonly leveraged in disposable spam campaigns`);
  }

  // 4. Subdomain depth
  const subdomainCount = Math.max(0, parts.length - 2);
  if (subdomainCount >= 3) {
    score += 25;
    signals.push(`Excessive subdomain nesting (${subdomainCount} subdomains), often used for brand impersonation`);
  } else if (subdomainCount === 2) {
    score += 10;
  }

  // 5. Punycode / Homoglyph
  const hasPunycode = hostname.includes('xn--');
  if (hasPunycode) {
    score += 35;
    signals.push('Punycode encoded domain (possible homoglyph / visual character deception attack)');
  }

  // 6. Embedded credentials or redirection characters
  if (urlObj.username || urlObj.password || fullHref.includes('@')) {
    score += 40;
    signals.push('Embedded userinfo/credentials delimiter (@) used to mask real destination authority');
  }

  // 7. Phishing keywords in suspicious contexts
  const matchedKeywords = PHISHING_KEYWORDS.filter(kw =>
    (hostname.includes(kw) && !hostname.endsWith(`${kw}.com`)) ||
    pathname.includes(kw) ||
    searchParams.includes(kw)
  );

  if (matchedKeywords.length > 0) {
    const penalty = Math.min(30, matchedKeywords.length * 15);
    score += penalty;
    signals.push(`Sensitive authentication terms detected in URL path/host: ${matchedKeywords.slice(0, 3).join(', ')}`);
  }

  // 8. Entropy and length
  const entropy = calculateEntropy(pathname + searchParams);
  if (entropy > 4.4 && (pathname.length + searchParams.length) > 25) {
    score += 15;
    signals.push('High Shannon entropy string in URL path/query parameters, indicative of hash obfuscation');
  }

  if (fullHref.length > 200) {
    score += 10;
    signals.push('Extremely long URL (>200 characters) frequently utilized to disguise redirection targets');
  }

  // Bound score 0-100
  const finalScore = Math.min(100, Math.max(0, score));

  let classification: ScanClassification = 'Safe';
  let recommendation = 'Standard browsing precautions apply. Always verify certificate identity before logging in.';

  if (finalScore >= 70) {
    classification = 'Malicious';
    recommendation = 'High risk. Do NOT visit this link or input credentials. High confidence phishing or malicious delivery pattern.';
  } else if (finalScore >= 30) {
    classification = 'Suspicious';
    recommendation = 'Proceed with heightened vigilance. Verify the sender and confirm genuine organization domain before interacting.';
  } else {
    classification = 'Safe';
    if (signals.length === 0) {
      signals.push('Valid HTTPS protocol with standard domain authority structure');
      signals.push('Standard top-level domain with low abuse index');
      signals.push('No deceptive redirect parameters or credential harvesting signatures found');
    }
  }

  const details: ScanDetails = {
    domain: hostname,
    protocol: urlObj.protocol.replace(':', ''),
    hasHttps: isHttps,
    isIpAddress: isIpHost,
    subdomainCount,
    suspiciousTld: isSuspiciousTld,
    containsSuspiciousKeywords: matchedKeywords.length > 0,
    entropyScore: entropy,
    urlLength: fullHref.length,
    hasPunycode
  };

  return {
    url: rawUrl,
    risk_score: finalScore,
    classification,
    risk_signals: signals,
    recommendation,
    scan_timestamp: new Date().toISOString(),
    details
  };
}
