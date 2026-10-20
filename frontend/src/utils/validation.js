/**
 * Client-side URL validation.
 *
 * Browsers happily accept "google.com" as a relative path, so we require an
 * explicit http/https scheme and a dotted hostname. We also reject credentials
 * embedded in the URL (https://paypal.com@evil.tld) because that is the exact
 * obfuscation trick phishers use and users usually misread it.
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:']
const MAX_LENGTH = 2048

export function normalizeUrl(raw) {
  return (raw || '').trim()
}

/**
 * @returns {{ valid: boolean, error: string|null, url: string }}
 */
export function validateUrl(raw) {
  const url = normalizeUrl(raw)

  if (!url) {
    return { valid: false, error: 'Paste a URL first — even the boring ones deserve a check.', url }
  }

  if (/\s/.test(url)) {
    return { valid: false, error: 'URLs cannot contain spaces. That is how the bad guys smuggle things.', url }
  }

  if (url.length > MAX_LENGTH) {
    return { valid: false, error: `That URL is ${url.length} characters. Nothing legitimate is that chatty.`, url }
  }

  // If no scheme is given, assume https:// so users can type "example.com".
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`

  let parsed
  try {
    parsed = new URL(candidate)
  } catch {
    return { valid: false, error: 'That does not parse as a URL. Try something like https://example.com/login', url }
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return { valid: false, error: `Only http:// and https:// links can be scanned (got ${parsed.protocol}).`, url }
  }

  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    return { valid: false, error: 'Missing a real domain — e.g. example.com.', url }
  }

  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: 'This URL hides credentials before the "@" — a classic phishing trick. Do not open it.',
      url,
    }
  }

  return { valid: true, error: null, url: parsed.href }
}
