import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import URLInput from '../components/URLInput.jsx'
import ScanButton from '../components/ScanButton.jsx'
import ResultsDisplay from '../components/ResultsDisplay.jsx'
import StickmanAssistant from '../components/StickmanAssistant.jsx'
import RiskGauge from '../components/RiskGauge.jsx'
import ErrorNotice from '../components/ErrorNotice.jsx'
import { pickJoke, jokesForMood, moodForClassification } from '../utils/jokes.js'

const SAFE = {
  submittedUrl: 'https://www.google.com/',
  riskScore: 5,
  classification: 'safe',
  modelProbability: 0.01,
  signals: [],
  recommendation: 'This URL appears safe to visit.',
}

const MALICIOUS = {
  submittedUrl: 'http://paypa1.com-security.update.net/',
  riskScore: 85,
  classification: 'malicious',
  modelProbability: 0.92,
  signals: [
    { signal: 'suspicious_tld', description: 'URL uses an uncommon TLD', weight: 0.3 },
    { signal: 'brand_imitation', description: 'Imitates PayPal', weight: 0.45 },
  ],
  recommendation: 'Do not enter any personal information on this site.',
}

describe('URLInput', () => {
  it('renders the value and emits changes', () => {
    const onChange = vi.fn()
    render(<URLInput value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'https://a.com' } })
    expect(onChange).toHaveBeenCalledWith('https://a.com')
  })

  it('shows a validation message with role=alert', () => {
    render(<URLInput value="bad url" onChange={() => {}} error="URLs cannot contain spaces." touched />)
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot contain spaces/i)
  })

  it('submits on Enter', () => {
    const onSubmit = vi.fn()
    render(<URLInput value="https://a.com" onChange={() => {}} onSubmit={onSubmit} />)
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalled()
  })
})

describe('ScanButton', () => {
  it('is disabled and busy while loading', () => {
    render(<ScanButton loading onClick={() => {}} />)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(btn).toHaveTextContent(/scanning/i)
  })
})

describe('RiskGauge', () => {
  it('exposes the score via an accessible label', () => {
    render(<RiskGauge score={85} classification="malicious" />)
    expect(screen.getByRole('img')).toHaveAccessibleName(/risk score 85 out of 100/i)
    expect(screen.getByTestId('gauge-band')).toHaveTextContent('malicious')
  })
})

describe('ResultsDisplay', () => {
  it('renders classification, recommendation and signals', () => {
    render(<ResultsDisplay result={MALICIOUS} />)
    expect(screen.getByTestId('classification')).toHaveTextContent('malicious')
    expect(screen.getByTestId('recommendation')).toHaveTextContent(/Do not enter any personal information/i)
    expect(screen.getByTestId('signal-list')).toBeInTheDocument()
    expect(screen.getByText(/Brand Imitation/)).toBeInTheDocument()
    expect(screen.getByTestId('risk-score-value')).toBeInTheDocument()
  })

  it('orders signals by weight, highest first', () => {
    render(<ResultsDisplay result={MALICIOUS} />)
    const items = screen.getAllByTestId('signal-list').flatMap((ul) => Array.from(ul.querySelectorAll('li')))
    expect(items[0]).toHaveTextContent('Brand Imitation')
    expect(items[1]).toHaveTextContent('Suspicious Tld')
  })

  it('renders an empty-signal message for a clean URL', () => {
    render(<ResultsDisplay result={SAFE} />)
    expect(screen.getByText(/No risk signals fired/i)).toBeInTheDocument()
  })

  it('renders nothing without a result', () => {
    const { container } = render(<ResultsDisplay result={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('StickmanAssistant', () => {
  it('always shows a joke', () => {
    render(<StickmanAssistant />)
    expect(screen.getByTestId('stickman-joke').textContent.length).toBeGreaterThan(20)
  })

  it('reacts to a malicious result with an alarmed joke', () => {
    render(<StickmanAssistant result={MALICIOUS} />)
    const text = screen.getByTestId('stickman-joke').textContent
    expect(jokesForMood('alarmed').some((j) => j.text === text)).toBe(true)
  })

  it('cycles to a different joke on click', () => {
    render(<StickmanAssistant />)
    const before = screen.getByTestId('stickman-joke').textContent
    fireEvent.click(screen.getByRole('button', { name: /another/i }))
    expect(screen.getByTestId('stickman-joke').textContent).not.toBe(before)
  })
})

describe('jokes util', () => {
  it('is deterministic when seeded', () => {
    const a = pickJoke({ mood: 'calm', seed: 'https://a.com' })
    const b = pickJoke({ mood: 'calm', seed: 'https://a.com' })
    expect(a.id).toBe(b.id)
  })

  it('maps classifications to moods', () => {
    expect(moodForClassification('safe')).toBe('calm')
    expect(moodForClassification('suspicious')).toBe('wary')
    expect(moodForClassification('malicious')).toBe('alarmed')
  })
})

describe('ErrorNotice', () => {
  it('shows the message and a retry action', () => {
    const onRetry = vi.fn()
    render(<ErrorNotice error={{ message: 'Backend unreachable', kind: 'network' }} onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/Backend unreachable/)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('renders nothing when there is no error', () => {
    const { container } = render(<ErrorNotice error={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
