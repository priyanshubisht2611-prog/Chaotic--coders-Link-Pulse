import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, normalizeScanResponse, scanUrl } from '../utils/api.js'

const MALICIOUS = {
  submitted_url: 'http://paypa1.com-security.update.net/',
  risk_score: 85,
  classification: 'malicious',
  model_probability: 0.92,
  explanatory_risk_signals: [
    { signal: 'suspicious_tld', description: 'Odd TLD', weight: 0.3 },
    { signal: 'brand_imitation', description: 'Imitates PayPal', weight: 0.4 },
  ],
  recommendation: 'Do not enter personal information.',
}

const jsonResponse = (body, init = {}) => ({
  ok: init.status ? init.status < 400 : true,
  status: init.status ?? 200,
  json: async () => body,
})

describe('normalizeScanResponse', () => {
  it('maps the contract payload into camelCase UI fields', () => {
    const r = normalizeScanResponse(MALICIOUS)
    expect(r.riskScore).toBe(85)
    expect(r.classification).toBe('malicious')
    expect(r.modelProbability).toBeCloseTo(0.92)
    expect(r.signals).toHaveLength(2)
    expect(r.recommendation).toMatch(/Do not enter/)
  })

  it('clamps out-of-range values', () => {
    const r = normalizeScanResponse({ ...MALICIOUS, risk_score: 140, model_probability: 3 })
    expect(r.riskScore).toBe(100)
    expect(r.modelProbability).toBe(1)
  })

  it('tolerates a missing signals array', () => {
    const r = normalizeScanResponse({ ...MALICIOUS, explanatory_risk_signals: undefined })
    expect(r.signals).toEqual([])
  })

  it('rejects a non-numeric risk score', () => {
    expect(() => normalizeScanResponse({ ...MALICIOUS, risk_score: 'high' })).toThrow(ApiError)
  })

  it('rejects an unknown classification', () => {
    expect(() => normalizeScanResponse({ ...MALICIOUS, classification: 'spicy' })).toThrow(
      /Unrecognised classification/
    )
  })
})

describe('scanUrl', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('POSTs the URL to /scan and returns normalized data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(MALICIOUS))
    vi.stubGlobal('fetch', fetchMock)

    const result = await scanUrl('http://paypa1.com-security.update.net/')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toContain('/scan')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({ url: 'http://paypa1.com-security.update.net/' })
    expect(result.riskScore).toBe(85)
  })

  it('surfaces validation errors from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ error: 'ValidationError', detail: 'Invalid URL format', field: 'url' }, { status: 422 })
      )
    )

    await expect(scanUrl('nope')).rejects.toMatchObject({
      kind: 'validation',
      status: 422,
      message: 'Invalid URL format',
    })
  })

  it('maps a 500 into a server error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: 'InternalServerError', detail: 'Boom' }, { status: 500 }))
    )

    await expect(scanUrl('https://a.com')).rejects.toMatchObject({ kind: 'server', status: 500 })
  })

  it('maps a network failure into a readable message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(scanUrl('https://a.com')).rejects.toMatchObject({ kind: 'network' })
  })

  it('flags a malformed 200 response as a contract error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ hello: 'world' })))

    await expect(scanUrl('https://a.com')).rejects.toMatchObject({ kind: 'contract' })
  })
})
