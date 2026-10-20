import { useState } from 'react'
import RiskGauge from './RiskGauge.jsx'
import SignalList from './SignalList.jsx'
import { stylesFor, bandForScore, formatPercent } from '../utils/risk.js'

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard API needs a secure context; fail quietly rather than throwing.
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
      aria-label="Copy scanned URL"
    >
      {copied ? 'copied' : 'copy'}
    </button>
  )
}

export default function ResultsDisplay({ result }) {
  if (!result) return null

  const { submittedUrl, riskScore, classification, modelProbability, signals, recommendation } = result
  const style = stylesFor(classification)
  const band = bandForScore(riskScore)

  return (
    <section
      className={`card animate-fade-up overflow-hidden ring-1 ${style.ring}`}
      data-testid="results"
      aria-live="polite"
    >
      {/* Header strip: verdict + URL */}
      <div className="flex flex-col gap-3 border-b border-white/[0.07] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="label-mono">Verdict</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${style.bg} ${style.text}`}
              aria-hidden="true"
            >
              {style.icon}
            </span>
            <h2 className={`font-display text-xl font-bold capitalize ${style.text}`} data-testid="classification">
              {classification}
            </h2>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.chip}`}>
              {band.label} band
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">{style.headline}</p>
        </div>

        <div className="min-w-0 sm:max-w-[45%]">
          <p className="label-mono">Scanned</p>
          <div className="mt-1 flex items-start gap-1">
            <p className="break-all font-mono text-xs leading-relaxed text-slate-400" title={submittedUrl}>
              {submittedUrl}
            </p>
            <CopyButton value={submittedUrl} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-7">
        {/* Gauge + model probability */}
        <div className="flex flex-col items-center gap-4">
          <RiskGauge score={riskScore} classification={classification} size={280} />

          <dl className="w-full space-y-1.5 rounded-xl border border-white/[0.07] bg-ink-850/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[11px] text-slate-500">Model probability</dt>
              <dd className="font-mono text-xs text-slate-300">{formatPercent(modelProbability)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[11px] text-slate-500">Risk score</dt>
              <dd className="font-mono text-xs text-slate-300">{Math.round(riskScore)} / 100</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[11px] text-slate-500">Signals fired</dt>
              <dd className="font-mono text-xs text-slate-300">{signals.length}</dd>
            </div>
          </dl>
        </div>

        {/* Signals + recommendation */}
        <div className="min-w-0 space-y-5">
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="font-display text-sm font-semibold text-slate-200">Why this score</h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">
                by weight
              </span>
            </div>
            <SignalList signals={signals} accent={band.hex} />
          </div>

          {recommendation && (
            <div className={`rounded-xl border ${style.border} ${style.bg} p-3.5`}>
              <p className="label-mono mb-1">Recommendation</p>
              <p className={`text-sm leading-relaxed ${style.text}`} data-testid="recommendation">
                {recommendation}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
