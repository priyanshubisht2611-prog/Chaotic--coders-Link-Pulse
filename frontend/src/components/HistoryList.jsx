import { bandForScore } from '../utils/risk.js'

export default function HistoryList({ items = [], onSelect, onClear }) {
  if (!items.length) return null

  return (
    <div className="card p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="label-mono">Recent scans</p>
        <button
          type="button"
          onClick={onClear}
          className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600 transition hover:text-slate-400"
        >
          clear
        </button>
      </div>

      <ul className="space-y-1">
        {items.map((item, i) => {
          const band = bandForScore(item.riskScore)
          return (
            <li key={`${item.submittedUrl}-${i}`}>
              <button
                type="button"
                onClick={() => onSelect?.(item)}
                className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[0.04]"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: band.hex }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-400 group-hover:text-slate-200">
                  {item.submittedUrl}
                </span>
                <span className="shrink-0 font-mono text-[10px]" style={{ color: band.hex }}>
                  {Math.round(item.riskScore)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
