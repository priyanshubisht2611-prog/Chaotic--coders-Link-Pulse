import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App.jsx'

const MALICIOUS = {
  submitted_url: 'http://paypa1.com-security.update.net/',
  risk_score: 85,
  classification: 'malicious',
  model_probability: 0.92,
  explanatory_risk_signals: [
    { signal: 'brand_imitation', description: 'Imitates PayPal', weight: 0.4 },
  ],
  recommendation: 'Do not enter any personal information on this site.',
}

const ok = (body) => ({ ok: true, status: 200, json: async () => body })

describe('App integration', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the dashboard shell', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /is this link a trap/i })).toBeInTheDocument()
    expect(screen.getByText(/nothing scanned yet/i)).toBeInTheDocument()
  })

  it('shows a validation error and never calls the API for a bad URL', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'not a url' } })
    fireEvent.click(screen.getByRole('button', { name: /scan url/i }))

    // Inline validation wins — no network request, no ErrorNotice banner.
    expect(fetchMock).not.toHaveBeenCalled()
    // The field itself renders an alert; the test wants no ErrorNotice alert.
    expect(screen.queryByRole('alert', { name: /scan failed/i })).not.toBeInTheDocument()
    // The URL contains a space — that triggers a whitespace error.
    expect(screen.getByText(/cannot contain spaces/i)).toBeInTheDocument()
  })

  it('renders results after a successful scan', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok(MALICIOUS)))

    render(<App />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'http://paypa1.com-security.update.net/' } })
    fireEvent.click(screen.getByRole('button', { name: /scan url/i }))

    expect(await screen.findByTestId('results')).toBeInTheDocument()
    expect(screen.getByTestId('classification')).toHaveTextContent('malicious')
    expect(screen.getByTestId('recommendation')).toHaveTextContent(/Do not enter/i)
    expect(screen.getByText(/brand imitation/i)).toBeInTheDocument()
  })

  it('renders a friendly error when the backend is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    render(<App />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'https://example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /scan url/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/could not reach the linkpulse api/i)
  })

  it('shows a loading state while the request is in flight', async () => {
    let resolve
    vi.stubGlobal('fetch', vi.fn(() => new Promise((r) => { resolve = r })))

    render(<App />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'https://example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /scan url/i }))

    expect(await screen.findByTestId('scanning-state')).toBeInTheDocument()

    resolve(ok({ ...MALICIOUS, risk_score: 5, classification: 'safe', explanatory_risk_signals: [] }))
    await waitFor(() => expect(screen.getByTestId('results')).toBeInTheDocument())
  })

  it('prefills and scans a sample from the empty state', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok(MALICIOUS))
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Malicious' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(await screen.findByTestId('results')).toBeInTheDocument()
  })
})
