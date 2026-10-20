import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { pickJoke, pickMove, moodForClassification } from '../utils/jokes.js'

/**
 * The LinkPulse security assistant.
 *
 * A hand-drawn stickman in SVG that reacts to the current verdict. He offers a
 * joke on demand (and once unprompted per new result) — deliberately opt-in
 * enough that he never covers the actual risk information.
 */

const MOODS = {
  calm: { accent: '#22c55e', label: 'Guardian of the obvious', bubble: 'border-emerald-500/30 bg-emerald-500/[0.06]' },
  wary: { accent: '#f59e0b', label: 'Narrowing his drawn eyes', bubble: 'border-amber-500/30 bg-amber-500/[0.06]' },
  alarmed: { accent: '#ef4444', label: 'Visibly alarmed', bubble: 'border-rose-500/30 bg-rose-500/[0.06]' },
}

function Stickman({ mood = 'calm', accent }) {
  const alarmed = mood === 'alarmed'
  const wary = mood === 'wary'

  return (
    <svg
      viewBox="0 0 120 160"
      className={`h-36 w-28 shrink-0 ${alarmed ? 'animate-float-slow' : ''}`}
      role="img"
      aria-label="Stickman security assistant"
    >
      {/* shadow */}
      <ellipse cx="60" cy="152" rx="26" ry="4" fill="#000" opacity="0.35" />

      <g stroke={accent} strokeWidth="3.5" strokeLinecap="round" fill="none">
        {/* legs */}
        <path d={alarmed ? 'M60 104 L44 140 M60 104 L78 138' : 'M60 104 L48 142 M60 104 L72 142'} />
        {/* body */}
        <path d="M60 66 L60 104" />
        {/* arms — raised when alarmed, one scratching head when wary */}
        {alarmed ? (
          <path d="M60 76 L36 54 M60 76 L84 52" />
        ) : wary ? (
          <path d="M60 78 L38 92 M60 78 L82 66" />
        ) : (
          <path d="M60 78 L38 96 M60 78 L82 96" />
        )}
      </g>

      {/* head */}
      <circle cx="60" cy="46" r="17" fill="#0b1020" stroke={accent} strokeWidth="3.5" />

      {/* face */}
      <g stroke={accent} strokeWidth="3" strokeLinecap="round" fill="none">
        {alarmed ? (
          <>
            <path d="M53 41 L57 45 M57 41 L53 45" />
            <path d="M63 41 L67 45 M67 41 L63 45" />
            <ellipse cx="60" cy="55" rx="4.5" ry="5.5" />
          </>
        ) : wary ? (
          <>
            <path d="M52 43 L58 43" />
            <path d="M62 43 L68 43" />
            <path d="M55 55 Q60 51 65 55" />
          </>
        ) : (
          <>
            <circle cx="55" cy="43" r="1.6" fill={accent} stroke="none" />
            <circle cx="65" cy="43" r="1.6" fill={accent} stroke="none" />
            <path d="M54 53 Q60 58 66 53" />
          </>
        )}
      </g>

      {/* hard hat */}
      <path
        d="M42 34 Q60 12 78 34"
        fill={accent}
        fillOpacity="0.18"
        stroke={accent}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M38 35 L82 35" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />

      {/* clipboard / magnifier prop */}
      {alarmed ? (
        <g stroke={accent} strokeWidth="3" fill="none" opacity="0.9">
          <rect x="82" y="72" width="16" height="20" rx="2" transform="rotate(12 90 82)" />
        </g>
      ) : (
        <g stroke={accent} strokeWidth="2.5" fill="none" opacity="0.9">
          <circle cx="88" cy="94" r="6" />
          <path d="M92.5 98.5 L99 105" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}

export default function StickmanAssistant({ result = null, error = null }) {
  const mood = useMemo(() => {
    if (error) return 'alarmed'
    if (!result) return 'calm'
    return moodForClassification(result.classification)
  }, [result, error])

  const seed = result?.submittedUrl ?? null
  const [joke, setJoke] = useState(() => pickJoke({ mood: 'calm', seed: 'welcome' }))
  const [move, setMove] = useState(() => pickMove('welcome'))
  const [autoShown, setAutoShown] = useState(false)
  const lastSeed = useRef(null)

  // On a new result, quietly swap in a matching joke once so the panel keeps
  // up with the verdict without the user having to click anything.
  useEffect(() => {
    if (!seed || seed === lastSeed.current) return
    lastSeed.current = seed
    const nextMood = moodForClassification(result?.classification)
    setJoke(pickJoke({ mood: nextMood, seed }))
    setMove(pickMove(seed))
    setAutoShown(true)
    const t = setTimeout(() => setAutoShown(false), 6000)
    return () => clearTimeout(t)
  }, [seed, result?.classification])

  const nextJoke = useCallback(() => {
    setJoke((prev) => pickJoke({ mood, excludeId: prev.id }))
    setMove(pickMove())
    setAutoShown(false)
  }, [mood])

  const theme = MOODS[mood]

  return (
    <aside
      className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
      aria-label="Security assistant"
      data-testid="stickman-assistant"
    >
      <div className="flex items-center justify-center sm:justify-start">
        <Stickman mood={mood} accent={theme.accent} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="font-display text-sm font-semibold text-slate-200">Captain Phishguard</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{theme.label}</p>
          </div>

          <button
            type="button"
            onClick={nextJoke}
            className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 transition hover:border-white/25 hover:text-slate-200"
          >
            Another
          </button>
        </div>

        <div
          className={`relative mt-3 rounded-xl border px-3 py-2.5 ${theme.bubble}`}
          aria-live={autoShown ? 'polite' : 'off'}
        >
          <p className="text-[13px] leading-relaxed text-slate-300" data-testid="stickman-joke">
            {joke.text}
          </p>
          <p className="mt-1.5 font-mono text-[10px] italic text-slate-500">— {move}</p>
        </div>
      </div>
    </aside>
  )
}
