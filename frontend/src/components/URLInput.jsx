import { forwardRef, useId } from 'react'

/**
 * Controlled URL field. Validation is owned by the parent so the same verdict
 * drives both the inline message and the scan button's enabled state.
 */
const URLInput = forwardRef(function URLInput(
  { value, onChange, onSubmit, error, disabled = false, touched = false },
  ref
) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const showError = Boolean(error) && (touched || Boolean(value))

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="label-mono mb-2 block">
        URL to inspect
      </label>

      <div
        className={[
          'group relative flex items-center gap-2 rounded-xl border bg-ink-850/80 px-3 py-2 transition',
          'focus-within:border-pulse-400/60 focus-within:bg-ink-850',
          showError
            ? 'border-rose-500/60 shadow-[0_0_0_1px_rgba(244,63,94,0.25)]'
            : 'border-white/10 hover:border-white/20',
        ].join(' ')}
      >
        <span aria-hidden="true" className="font-mono text-xs text-slate-500">
          https://
        </span>

        <input
          ref={ref}
          id={inputId}
          name="url"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck="false"
          placeholder="suspicious-site.example/login?verify=1"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSubmit?.()
            }
          }}
          aria-invalid={showError}
          aria-describedby={showError ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear URL"
            className="rounded-md p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-2 min-h-[1.25rem]">
        {showError ? (
          <p id={errorId} role="alert" className="flex items-start gap-1.5 text-xs text-rose-300">
            <span aria-hidden="true">⚠</span>
            <span>{error}</span>
          </p>
        ) : (
          <p className="text-xs text-slate-600">
            We only send the URL for analysis — nothing is fetched from the site.
          </p>
        )}
      </div>
    </div>
  )
})

export default URLInput
