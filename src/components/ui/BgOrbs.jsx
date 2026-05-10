import React, { useEffect, useRef, useMemo } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   CHROME SPHERES — physically-modelled metallic orbs.
   Each orb has its own drift rhythm, scale rhythm, and specular-rotation rhythm
   so the scene never visibly loops. No two timings share a value.
───────────────────────────────────────────────────────────────────────────── */

const SPHERES = [
  // Enormous one bleeding off the top-left — the anchor of the scene.
  { size: '78vmin', top:    '-22vmin', left:  '-18vmin', drift: 47, scale: 53, spec: 61, depth: 0.92, hue: 0.55 },
  // Medium, lower-right
  { size: '46vmin', bottom: '-10vmin', right: '-6vmin',  drift: 39, scale: 31, spec: 44, depth: 0.78, hue: 0.42 },
  // Small, mid-screen, barely moves
  { size: '22vmin', top:    '38%',     left:  '54%',     drift: 71, scale: 67, spec: 29, depth: 0.66, hue: 0.50 },
  // Smaller accent, upper-right area
  { size: '15vmin', top:    '12%',     right: '22%',     drift: 34, scale: 41, spec: 23, depth: 0.55, hue: 0.48 },
  // Tiny, lower-left
  { size: '11vmin', bottom: '18%',     left:  '14%',     drift: 56, scale: 37, spec: 19, depth: 0.62, hue: 0.46 },
]

export default function BgOrbs() {
  const auraRef = useRef(null)

  // Cursor aura — soft pool of warmth that follows the mouse, with heavy easing.
  useEffect(() => {
    let raf = null
    let tx = window.innerWidth / 2
    let ty = window.innerHeight / 2
    let cx = tx, cy = ty

    const onMove = (e) => { tx = e.clientX; ty = e.clientY }
    const onLeave = () => { tx = window.innerWidth / 2; ty = window.innerHeight / 2 }

    const tick = () => {
      cx += (tx - cx) * 0.06
      cy += (ty - cy) * 0.06
      if (auraRef.current) {
        auraRef.current.style.setProperty('--mx', `${cx}px`)
        auraRef.current.style.setProperty('--my', `${cy}px`)
      }
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      {/* Background canvas — near-black with subtle blue-black warmth, no gradient.
          All scene light comes from the orbs, not the sky. */}
      <div className="bg-canvas" />

      {/* Vignette — pulls focus toward the centre */}
      <div className="bg-vignette" />

      {/* Chrome spheres */}
      <div className="bg-orbs">
        {SPHERES.map((s, i) => (
          <div
            key={i}
            className="chrome-orb"
            style={{
              width: s.size, height: s.size,
              top: s.top, left: s.left, right: s.right, bottom: s.bottom,
              '--drift-dur': `${s.drift}s`,
              '--scale-dur': `${s.scale}s`,
              '--spec-dur':  `${s.spec}s`,
              '--depth':     s.depth,
              '--hue':       s.hue,
              animationDelay: `${-i * 3.7}s, ${-i * 5.1}s`,
            }}
          >
            {/* Subsurface bloom — the faintest halo, like the orb is gently glowing from inside */}
            <div className="chrome-orb__bloom" />
            {/* The sphere body itself — chrome gradient + specular highlight */}
            <div className="chrome-orb__body" />
            {/* Cast shadow beneath — gives weight, like it's resting on something */}
            <div className="chrome-orb__shadow" />
          </div>
        ))}
      </div>

      {/* Cursor aura — silver pool, follows the mouse */}
      <div ref={auraRef} className="cursor-aura" />

      {/* Grain — barely-perceptible texture so nothing reads as plastic */}
      <div className="grain" aria-hidden="true" />
    </>
  )
}
