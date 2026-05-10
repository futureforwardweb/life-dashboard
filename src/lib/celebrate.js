// Lightweight event bus for completion celebrations.
// Emit from anywhere; CelebrationOverlay listens and renders particles + sound.

const listeners = new Set()
let audioCtx = null

function getAudioContext() {
  if (audioCtx) return audioCtx
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    audioCtx = new Ctx()
  } catch { audioCtx = null }
  return audioCtx
}

// Soft chime — generated via Web Audio API. Quiet, brief, pleasant.
function playChime(variant = 'task') {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})

  // Frequencies per variant — major-third intervals, kept gentle
  const tones = {
    task:  [880, 1108],          // A5 → C#6
    habit: [659, 880, 1108],     // E5 → A5 → C#6
    goal:  [523, 784, 1046, 1318], // C5 → G5 → C6 → E6
  }[variant] || [880]

  const now = ctx.currentTime
  tones.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const start = now + i * 0.08
    const dur = 0.4
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.06, start + 0.02)  // very quiet
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + dur)
  })
}

export function celebrate({ x = window.innerWidth / 2, y = window.innerHeight / 2, variant = 'task', message = '' } = {}) {
  playChime(variant)
  const event = { x, y, variant, message, id: Date.now() + Math.random(), timestamp: Date.now() }
  listeners.forEach(fn => fn(event))
}

export function onCelebrate(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Helper: extract click coordinates from any DOM event for particle origin
export function celebrateAt(domEvent, opts = {}) {
  const target = domEvent?.currentTarget?.getBoundingClientRect?.()
  if (target) {
    return celebrate({
      x: target.left + target.width / 2,
      y: target.top + target.height / 2,
      ...opts,
    })
  }
  return celebrate(opts)
}
