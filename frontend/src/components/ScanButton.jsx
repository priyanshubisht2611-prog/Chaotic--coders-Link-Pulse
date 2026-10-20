/**
 * Primary action. Shows a definite, labelled loading state instead of a spinner
 * on its own so screen-reader users know work is in progress.
 */
export default function ScanButton({ onClick, loading = false, disabled = false, children }) {
  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={[
        'relative w-full overflow-hidden rounded-xl px-5 py-3 font-display text-sm font-semibold tracking-wide transition',
        'sm:w-auto sm:min-w-[9.5rem]',
        isDisabled
          ? 'cursor-not-allowed bg-ink-700 text-slate-500'
          : 'bg-pulse-500 text-ink-950 shadow-[0_10px_30px_-12px_rgba(34,197,94,0.9)] hover:bg-pulse-400 active:scale-[0.99]',
      ].join(' ')}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-scan-sweep bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
      )}

      <span className="relative flex items-center justify-center gap-2">
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Scanning…
          </>
        ) : (
          <>
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="9" cy="9" r="5.5" />
              <path d="M13.2 13.2 17 17" strokeLinecap="round" />
            </svg>
            {children ?? 'Scan URL'}
          </>
        )}
      </span>
    </button>
  )
}
