import { useCallback, useEffect, useRef, useState } from 'react'
import URLInput from './components/URLInput.jsx'
import ScanButton from './components/ScanButton.jsx'
import ResultsDisplay from './components/ResultsDisplay.jsx'
import StickmanAssistant from './components/StickmanAssistant.jsx'
import ErrorNotice from './components/ErrorNotice.jsx'
import EmptyState from './components/EmptyState.jsx'
import ScanningState from './components/ScanningState.jsx'
import HistoryList from './components/HistoryList.jsx'
import { scanUrl, ApiError, API_BASE_URL } from './utils/api.js'
import { validateUrl } from './utils/validation.js'

const HISTORY_LIMIT = 5

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-pulse-400/30 bg-pulse-500/10">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-pulse-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 13h4l2.5-7 3.5 13 2.5-9 1.5 3H22" />
        </svg>
      </span>
      <div>
        <p className="font-display text-base font-bold leading-none tracking-tight text-slate-100">
          Link<span className="text-pulse-400">Pulse</span>
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-slate-500">
          phishing scanner
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [input, setInput] = useState('')
  const [touched, setTouched] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])

  const controllerRef = useRef(null)
  const inputRef = useRef(null)

  const { valid, error: validationError, url: normalizedUrl } = validateUrl(input)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const runScan = useCallback(
    async (rawUrl) => {
      const check = validateUrl(rawUrl)
      setTouched(true)

      if (!check.valid) {
        // The inline field message is the single source of truth for format
        // problems — a second banner saying the same thing is just noise.
        setStatus('invalid')
        setResult(null)
        setError(null)
        inputRef.current?.focus()
        return
      }

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      setStatus('loading')
      setError(null)
      setResult(null)

      try {
        const data = await scanUrl(check.url, { signal: controller.signal })
        if (controller.signal.aborted) return

        setResult(data)
        setStatus('success')
        setHistory((prev) => {
          const next = [
            { submittedUrl: data.submittedUrl || check.url, riskScore: data.riskScore, classification: data.classification },
            ...prev,
          ]
          return next.slice(0, HISTORY_LIMIT)
        })
      } catch (err) {
        if (err?.name === 'AbortError' || controller.signal.aborted) return
        setError(
          err instanceof ApiError
            ? err
            : new ApiError('Something went wrong while scanning. Please try again.', { kind: 'server' })
        )
        setStatus('error')
      }
    },
    []
  )

  const handleSubmit = () => {
    runScan(input)
  }

  const handlePickSample = (sampleUrl) => {
    setInput(sampleUrl)
    setTouched(false)
    runScan(sampleUrl)
  }

  const handleReset = () => {
    controllerRef.current?.abort()
    setInput('')
    setResult(null)
    setError(null)
    setStatus('idle')
    setTouched(false)
    inputRef.current?.focus()
  }

  const isLoading = status === 'loading'
  const showEmpty = status === 'idle' || status === 'invalid'
  const canScan = input.trim().length > 0 && !isLoading && valid

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-ink-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600 sm:inline">
              api
            </span>
            <code className="hidden rounded-md border border-white/10 bg-ink-850 px-2 py-1 font-mono text-[10px] text-slate-500 sm:inline">
              {API_BASE_URL}
            </code>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 transition hover:border-white/25 hover:text-slate-200"
            >
              docs
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        {/* Hero */}
        <div className="mb-7">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            Is this link a trap?
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            Paste any URL. LinkPulse runs a Random Forest model over its structure and tells you
            what it found — in plain English, with the scoring reasons attached.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start">
          <div className="min-w-0 space-y-4">
            {/* Scan form */}
            <div className="card p-4 sm:p-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSubmit()
                }}
                noValidate
              >
                <URLInput
                  ref={inputRef}
                  value={input}
                  onChange={(v) => {
                    setInput(v)
                    if (status === 'error') setError(null)
                  }}
                  onSubmit={handleSubmit}
                  error={validationError}
                  touched={touched}
                  disabled={isLoading}
                />

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-mono text-[10px] text-slate-600">
                    {canScan && valid ? 'ready — press enter' : '\u00A0'}
                  </p>

                  <div className="flex items-center gap-2">
                    {(result || error) && !isLoading && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-xl border border-white/10 px-3 py-2.5 text-xs text-slate-400 transition hover:border-white/25 hover:text-slate-200"
                      >
                        Reset
                      </button>
                    )}
                    <ScanButton onClick={handleSubmit} loading={isLoading} disabled={!canScan}>
                      {result ? 'Scan again' : 'Scan URL'}
                    </ScanButton>
                  </div>
                </div>
              </form>
            </div>

            {/* Output area */}
            {isLoading && <ScanningState url={normalizedUrl || input} />}

            {status === 'error' && error && (
              <ErrorNotice error={error} onRetry={input.trim() ? handleSubmit : undefined} />
            )}

            {status === 'success' && result && <ResultsDisplay result={result} />}

            {showEmpty && <EmptyState onPick={handlePickSample} />}
          </div>

          {/* Sidebar */}
          <div className="min-w-0 space-y-4">
            <StickmanAssistant result={result} error={status === 'error' ? error : null} />

            <HistoryList
              items={history}
              onSelect={(item) => {
                setInput(item.submittedUrl)
                runScan(item.submittedUrl)
              }}
              onClear={() => setHistory([])}
            />

            <div className="card p-4">
              <p className="label-mono mb-2">How to read the score</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[11px] text-emerald-400">0–30</span>
                  <span className="text-slate-500">safe</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="font-mono text-[11px] text-amber-400">31–70</span>
                  <span className="text-slate-500">suspicious</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="font-mono text-[11px] text-rose-400">71–100</span>
                  <span className="text-slate-500">malicious</span>
                </li>
              </ul>
              <p className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-slate-600">
                A low score is not a guarantee. The model reads the URL, not the page.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-5">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-1 px-4 font-mono text-[10px] text-slate-600 sm:flex-row sm:px-6">
          <span>LinkPulse — explainable phishing detection</span>
          <span>Random Forest · FastAPI · React</span>
        </div>
      </footer>
    </div>
  )
}
