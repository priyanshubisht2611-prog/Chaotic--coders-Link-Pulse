const HINTS = {
  network: 'Start the API with `uvicorn backend.api.main:app --reload` and check VITE_API_BASE_URL.',
  timeout: 'Cold starts can take a few seconds. Retry once before assuming the service is down.',
  validation: 'The server rejected this URL. Check the format and try again.',
  server: 'The backend hit an internal error. It was logged — nothing sensitive was returned.',
  contract: 'The API responded, but the payload was not what the UI expects. Check the backend version.',
}

export default function ErrorNotice({ error, onRetry }) {
  if (!error) return null
  const kind = error.kind ?? 'server'

  return (
    <div
      role="alert"
      className="animate-fade-up rounded-2xl border border-rose-500/30 bg-rose-500/[0.07] p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-sm text-rose-300">
          ⚠
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold text-rose-200">Scan failed</p>
          <p className="mt-1 break-words text-sm text-rose-100/80">{error.message}</p>

          {HINTS[kind] && (
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-rose-200/50">{HINTS[kind]}</p>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-500/15"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
