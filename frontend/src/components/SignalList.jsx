import { humanizeSignal } from '../utils/risk.js'

/**
 * Explanatory signals, ordered by weight so the dominant reason reads first.
 * Weight is the contract's normalised 0-1 contribution.
 */
export default function SignalList({ signals = [], accent = '#22c55e' }) {
  const sorted = [...signals].sort((a, b) => b.weight - a.weight)

  if (!sorted.length) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-ink-850/50 px-4 py-5 text-center">
        <p className="text-sm text-slate-400">No risk signals fired.</p>
        <p className="mt-1 text-xs text-slate-600">
          The model found nothing suspicious in the structure of this URL.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-2.5" data-testid="signal-list">
      {sorted.map((s, i) => {
        const pct = Math.round((Number(s.weight) || 0) * 100)
        return (
          <li
            key={`${s.signal}-${i}`}
            className="rounded-xl border border-white/[0.07] bg-ink-850/60 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-200">{humanizeSignal(s.signal)}</p>
              <span className="shrink-0 font-mono text-[11px] text-slate-500">{pct}%</span>
            </div>

            {s.description && (
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{s.description}</p>
            )}

            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(3, pct)}%`, backgroundColor: accent, opacity: 0.85 }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
