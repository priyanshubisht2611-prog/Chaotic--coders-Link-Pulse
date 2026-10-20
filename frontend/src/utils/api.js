/**
 * LinkPulse API client.
 *
 * Base URL resolution:
 *   - VITE_API_BASE_URL if set (production / custom backend)
 *   - otherwise "/api", which Vite proxies to http://127.0.0.1:8000 in dev
 */

const RAW_BASE = import.meta.env?.VITE_API_BASE_URL ?? '/api'
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, '')

const DEFAULT_TIMEOUT_MS = 15000

export class ApiError extends Error {
  constructor(message, { status = 0, kind = 'network', field = null, payload = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.kind = kind // 'network' | 'validation' | 'server' | 'timeout' | 'contract'
    this.field = field
    this.payload = payload
  }
}

export const CLASSIFICATIONS = ['safe', 'suspicious', 'malicious']

/**
 * Validate that a /scan payload matches the documented contract. A backend
 * returning a 200 with a misshapen body is worse than a 500 — we fail loudly.
 */
export function normalizeScanResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError('The server returned an empty response.', { kind: 'contract' })
  }

  const riskScore = Number(data.risk_score)
  if (!Number.isFinite(riskScore)) {
    throw new ApiError('The server response was missing a numeric risk score.', { kind: 'contract' })
  }

  const classification = String(data.classification || '').toLowerCase()
  if (!CLASSIFICATIONS.includes(classification)) {
    throw new ApiError(
      `Unrecognised classification "${data.classification}" in server response.`,
      { kind: 'contract' }
    )
  }

  const signals = Array.isArray(data.explanatory_risk_signals)
    ? data.explanatory_risk_signals
        .filter((s) => s && typeof s === 'object')
        .map((s, i) => ({
          signal: String(s.signal ?? `signal_${i + 1}`),
          description: String(s.description ?? ''),
          weight: Number.isFinite(Number(s.weight)) ? clamp01(Number(s.weight)) : 0,
        }))
    : []

  const probability = Number(data.model_probability)

  return {
    submittedUrl: String(data.submitted_url ?? ''),
    riskScore: Math.min(100, Math.max(0, riskScore)),
    classification,
    modelProbability: Number.isFinite(probability) ? clamp01(probability) : null,
    signals,
    recommendation: String(data.recommendation ?? '').trim(),
  }
}

function clamp01(n) {
  return Math.min(1, Math.max(0, n))
}

/**
 * POST /scan
 * @param {string} url
 * @param {{ signal?: AbortSignal, timeoutMs?: number }} [options]
 * @returns {Promise<ReturnType<typeof normalizeScanResponse>>}
 */
export async function scanUrl(url, { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), timeoutMs)

  // Chain an external signal (e.g. component unmount) into ours.
  const onExternalAbort = () => controller.abort(signal?.reason)
  signal?.addEventListener?.('abort', onExternalAbort, { once: true })

  let response
  try {
    response = await fetch(`${API_BASE_URL}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError' || err?.name === 'TimeoutError') {
      if (signal?.aborted) throw err // caller cancelled — let it bubble up untouched
      throw new ApiError(
        'The scan timed out. The model may be cold-starting — try again in a moment.',
        { kind: 'timeout' }
      )
    }
    throw new ApiError(
      `Could not reach the LinkPulse API at ${API_BASE_URL}. Is the backend running?`,
      { kind: 'network' }
    )
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener?.('abort', onExternalAbort)
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const detail =
      (payload && (payload.detail || payload.error)) ||
      `Request failed with status ${response.status}.`

    if (response.status === 422 || response.status === 400 || payload?.error === 'ValidationError') {
      throw new ApiError(String(detail), {
        status: response.status,
        kind: 'validation',
        field: payload?.field ?? null,
        payload,
      })
    }

    throw new ApiError(String(detail), {
      status: response.status,
      kind: 'server',
      payload,
    })
  }

  return normalizeScanResponse(payload)
}
