import { describe, expect, it } from 'vitest'
import { validateUrl, normalizeUrl } from '../utils/validation.js'

describe('validateUrl', () => {
  it('rejects empty input', () => {
    const r = validateUrl('   ')
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/paste a url/i)
  })

  it('accepts a fully qualified https URL', () => {
    const r = validateUrl('https://www.google.com/')
    expect(r.valid).toBe(true)
    expect(r.error).toBeNull()
  })

  it('assumes https:// when the scheme is omitted', () => {
    const r = validateUrl('example.com/login')
    expect(r.valid).toBe(true)
    expect(r.url).toBe('https://example.com/login')
  })

  it('rejects non-http protocols', () => {
    expect(validateUrl('javascript:alert(1)').valid).toBe(false)
    expect(validateUrl('ftp://example.com/file').valid).toBe(false)
  })

  it('rejects whitespace inside the URL', () => {
    const r = validateUrl('https://exa mple.com')
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/spaces/i)
  })

  it('rejects credentials embedded before the @', () => {
    const r = validateUrl('https://paypal.com@evil.example/login')
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/classic phishing trick/i)
  })

  it('rejects hostnames without a dot', () => {
    expect(validateUrl('https://localhost').valid).toBe(false)
  })

  it('rejects absurdly long URLs', () => {
    const r = validateUrl(`https://example.com/${'a'.repeat(2100)}`)
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/characters/i)
  })

  it('normalizes surrounding whitespace', () => {
    expect(normalizeUrl('  https://a.com  ')).toBe('https://a.com')
  })
})
