const STEPS = [
  'Parsing URL structure',
  'Extracting lexical features',
  'Running Random Forest',
  'Assembling explanations',
]

export default function ScanningState({ url }) {
  return (
    <div className="card animate-fade-up p-5 sm:p-6" aria-busy="true" data-testid="scanning-state">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="label-mono">Scanning</p>
          <p className="mt-1 truncate font-mono text-xs text-slate-400" title={url}>
            {url}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-pulse-400/30 bg-pulse-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-pulse-400">
          working
        </span>
      </div>

      <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="absolute inset-y-0 w-1/3 animate-scan-sweep rounded-full bg-gradient-to-r from-transparent via-pulse-400 to-transparent" />
      </div>

      <ul className="mt-4 space-y-2">
        {STEPS.map((step, i) => (
          <li
            key={step}
            className="flex items-center gap-2 text-xs text-slate-500"
            style={{ animation: `fade-up 0.4s ease-out ${i * 120}ms both` }}
          >
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            {step}
          </li>
        ))}
      </ul>
    </div>
  )
}
