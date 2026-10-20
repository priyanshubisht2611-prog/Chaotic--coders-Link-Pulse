import { useEffect, useRef, useState } from 'react'
import { bandForScore } from '../utils/risk.js'

/**
 * 240°-sweep SVG gauge. The arc is drawn with stroke-dasharray so it animates
 * smoothly from 0 to the score, and the needle rotates in the same frame.
 */
const RADIUS = 80
const STROKE = 14
const SWEEP_DEG = 240
const START_DEG = 150 // bottom-left of the arc

function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const start = polar(cx, cy, r, startDeg)
  const end = polar(cx, cy, r, endDeg)
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

export default function RiskGauge({ score = 0, classification, size = 260 }) {
  const band = bandForScore(score)
  const color = band.hex
  const clamped = Math.min(100, Math.max(0, Number(score) || 0))

  const [animated, setAnimated] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const start = performance.now()
    const duration = 900
    const from = 0

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimated(from + (clamped - from) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [clamped])

  const cx = 130
  const cy = 130
  const backgroundArc = arcPath(cx, cy, RADIUS, START_DEG, START_DEG + SWEEP_DEG)
  const arcLength = (Math.PI * RADIUS * SWEEP_DEG) / 180
  const progress = animated / 100
  const needleAngle = START_DEG + SWEEP_DEG * progress
  const needleTip = polar(cx, cy, RADIUS - STROKE - 12, needleAngle)

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, maxWidth: '100%' }}
      role="img"
      aria-label={`Risk score ${Math.round(clamped)} out of 100, classified ${band.label}`}
    >
      <svg viewBox="0 0 260 232" className="w-full h-auto">
        <defs>
          <linearGradient id="gauge-glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={backgroundArc}
          fill="none"
          stroke="#1f2a4d"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Progress arc */}
        <path
          d={backgroundArc}
          fill="none"
          stroke="url(#gauge-glow)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={arcLength * (1 - progress)}
          style={{ filter: `drop-shadow(0 0 10px ${color}66)` }}
        />

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = START_DEG + (SWEEP_DEG * tick) / 100
          const outer = polar(cx, cy, RADIUS + STROKE / 2 + 8, angle)
          const inner = polar(cx, cy, RADIUS + STROKE / 2 + 2, angle)
          return (
            <line
              key={tick}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#334155"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )
        })}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          opacity={0.9}
        />
        <circle cx={cx} cy={cy} r="7" fill="#0b1020" stroke={color} strokeWidth="3" />

        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill="#f8fafc"
          style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 46, fontWeight: 700 }}
        >
          {Math.round(animated)}
        </text>
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          fill="#64748b"
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: 2 }}
        >
          RISK / 100
        </text>
      </svg>

      <div className="-mt-2 flex justify-center">
        <span
          className="rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ borderColor: `${color}55`, color, backgroundColor: `${color}14` }}
          data-testid="gauge-band"
        >
          {classification ? classification : band.label}
        </span>
      </div>
    </div>
  )
}
