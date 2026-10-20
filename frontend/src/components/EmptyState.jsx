const SAMPLES = [
  { label: 'Safe', url: 'https://www.google.com/', tone: 'text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10' },
  { label: 'Suspicious', url: 'http://bit.ly/3xQz9a', tone: 'text-amber-300 border-amber-500/30 hover:bg-amber-500/10' },
  { label: 'Malicious', url: 'http://paypa1.com-security.update.net/', tone: 'text-rose-300 border-rose-500/30 hover:bg-rose-500/10' },
]

export default function EmptyState({ onPick }) {
  return (
    <div className="animate-fade-up rounded-2xl border border-dashed border-white/10 bg-ink-900/40 p-6 text-center sm:p-8">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-ink-850">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3 4 6v6c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V6l-8-3Z" strokeLinejoin="round" />
          <path d="M12 9v3.5" strokeLinecap="round" />
          <circle cx="12" cy="15.6" r=".9" fill="currentColor" stroke="none" />
        </svg>
      </div>

      <h2 className="font-display text-lg font-semibold text-slate-200">Nothing scanned yet</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        Drop a link above and the model will rate it from 0 to 100, with the reasons spelled out.
      </p>

      <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap">
        <span className="label-mono mr-1 hidden sm:inline">Try</span>
        {SAMPLES.map((s) => (
          <button
            key={s.url}
            type="button"
            onClick={() => onPick?.(s.url)}
            className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition ${s.tone}`}
            title={s.url}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
