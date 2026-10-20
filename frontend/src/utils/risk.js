/**
 * Single source of truth for risk thresholds and colours.
 * Mirrors docs/api_contract.md: 0-30 safe, 31-70 suspicious, 71-100 malicious.
 */

export const RISK_BANDS = [
  { key: 'safe', label: 'Safe', min: 0, max: 30, hex: '#22c55e' },
  { key: 'suspicious', label: 'Suspicious', min: 31, max: 70, hex: '#f59e0b' },
  { key: 'malicious', label: 'Malicious', min: 71, max: 100, hex: '#ef4444' },
]

export function bandForScore(score) {
  const n = Number(score)
  if (!Number.isFinite(n)) return RISK_BANDS[0]
  if (n >= 71) return RISK_BANDS[2]
  if (n >= 31) return RISK_BANDS[1]
  return RISK_BANDS[0]
}

/** Tailwind class sets keyed by classification. Kept static so Tailwind can see them. */
export const CLASSIFICATION_STYLES = {
  safe: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    ring: 'ring-emerald-500/30',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    bar: 'bg-emerald-500',
    glow: 'shadow-[0_0_40px_-12px_rgba(34,197,94,0.7)]',
    icon: '✓',
    headline: 'Looks safe to visit',
  },
  suspicious: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    ring: 'ring-amber-500/30',
    chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    bar: 'bg-amber-500',
    glow: 'shadow-[0_0_40px_-12px_rgba(245,158,11,0.7)]',
    icon: '!',
    headline: 'Proceed with caution',
  },
  malicious: {
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/40',
    ring: 'ring-rose-500/30',
    chip: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    bar: 'bg-rose-500',
    glow: 'shadow-[0_0_40px_-12px_rgba(239,68,68,0.7)]',
    icon: '✕',
    headline: 'Do not enter information here',
  },
}

export function stylesFor(classification) {
  return CLASSIFICATION_STYLES[classification] ?? CLASSIFICATION_STYLES.safe
}

export function formatPercent(value) {
  if (!Number.isFinite(Number(value))) return '—'
  return `${Math.round(Number(value) * 100)}%`
}

/** Human label from a snake_case signal id. */
export function humanizeSignal(signal) {
  return String(signal || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
