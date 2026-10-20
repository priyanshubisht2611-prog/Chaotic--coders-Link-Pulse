/**
 * The Stickman's material. Deliberately dry — security humour should not get
 * in the way of "do not click that link".
 *
 * Each joke is tagged by mood so the assistant can react to the verdict:
 *   calm    -> safe results / idle
 *   wary    -> suspicious results
 *   alarmed -> malicious results
 */

const JOKES = [
  { id: 'passwords', mood: 'calm', text: 'Your password should be like a toothbrush: strong, personal, and never shared with the internet.' },
  { id: 'padlock', mood: 'calm', text: 'A padlock icon means the connection is encrypted. It does not mean the person on the other end has good intentions.' },
  { id: 'free-wifi', mood: 'calm', text: 'Free public Wi-Fi: because nothing says "private banking" like a router named after a coffee shop.' },
  { id: '2fa', mood: 'calm', text: 'Two-factor authentication: the seatbelt of the internet. Slightly annoying, occasionally life-saving.' },
  { id: 'updates', mood: 'calm', text: 'I clicked "remind me later" on software updates for a year. Now I am the reminder.' },
  { id: 'phishing-email', mood: 'wary', text: 'Phishing emails are like bad auditions: the logo is right, but the spelling gives them away.' },
  { id: 'crypto', mood: 'wary', text: 'If a stranger on the internet offers to double your crypto, they are not an investor. They are a business.' },
  { id: 'invoice', mood: 'wary', text: 'An unexpected invoice attachment is just a PDF with ambitions. Do not enable macros for it.' },
  { id: 'verify', mood: 'wary', text: '"Verify your account in 24 hours or we delete it" — said every company ever, and no company ever.' },
  { id: 'urgent', mood: 'alarmed', text: 'Urgency is the oldest trick in the book. Right after "trust me" and slightly before "what could go wrong".' },
  { id: 'gift-card', mood: 'alarmed', text: 'No government agency accepts payment in gift cards. I checked. Twice. With a lawyer.' },
  { id: 'login-page', mood: 'alarmed', text: 'That login page looked convincing. So does a cardboard cutout, until you try to shake its hand.' },
  { id: 'typosquat', mood: 'alarmed', text: 'One swapped letter in a domain is the whole heist. PaypaI with a capital I has been fooling humans for decades.' },
  { id: 'clicked', mood: 'alarmed', text: 'If you already clicked it: do not panic. Change the password, close the tab, and we will speak of it no more.' },
]

const MOVES = [
  'adjusts hard hat',
  'peers at the URL through a magnifying glass',
  'taps the clipboard knowingly',
  'shields eyes from suspicious fonts',
  'checks the domain twice',
]

/** Small deterministic hash so the same URL gives the same joke on re-render. */
function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function jokesForMood(mood = 'calm') {
  const pool = JOKES.filter((j) => j.mood === mood)
  return pool.length ? pool : JOKES
}

/**
 * Pick a joke. Pass a `seed` (e.g. the scanned URL) to keep it stable for that
 * result, or omit it for a fresh random pick.
 */
export function pickJoke({ mood = 'calm', seed = null, excludeId = null } = {}) {
  let pool = jokesForMood(mood)
  if (excludeId && pool.length > 1) pool = pool.filter((j) => j.id !== excludeId)

  if (seed) return pool[hashString(seed) % pool.length]
  return pool[Math.floor(Math.random() * pool.length)]
}

export function pickMove(seed = null) {
  if (seed) return MOVES[hashString(seed) % MOVES.length]
  return MOVES[Math.floor(Math.random() * MOVES.length)]
}

export function moodForClassification(classification) {
  if (classification === 'malicious') return 'alarmed'
  if (classification === 'suspicious') return 'wary'
  return 'calm'
}

export const JOKE_COUNT = JOKES.length
export default JOKES
