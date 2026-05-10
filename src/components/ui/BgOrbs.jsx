import React, { useEffect, useRef, useMemo } from 'react'

// Soft ambient orbs — mostly silvery with whisper-tints
const ambientOrbs = [
  {
    style: {
      width: '70vw', height: '70vw',
      background: 'radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.05) 0%, rgba(184,174,240,0.06) 30%, transparent 65%)',
      top: '-25vw', left: '-15vw',
      animation: 'orbDrift 26s ease-in-out infinite',
      filter: 'blur(80px)',
    },
  },
  {
    style: {
      width: '50vw', height: '50vw',
      background: 'radial-gradient(ellipse at 60% 60%, rgba(255,255,255,0.04) 0%, rgba(232,160,126,0.05) 35%, transparent 68%)',
      bottom: '-12vw', right: '-10vw',
      animation: 'orbDrift2 32s ease-in-out infinite',
      filter: 'blur(85px)',
    },
  },
  {
    style: {
      width: '36vw', height: '36vw',
      background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, rgba(143,199,194,0.04) 40%, transparent 70%)',
      top: '40%', left: '50%',
      animation: 'orbDrift 38s ease-in-out infinite reverse',
      animationDelay: '-10s',
      filter: 'blur(90px)',
    },
  },
]

// Chrome metallic spheres — solid, reflective, NOT blurred (foreground accents)
const chromeSpheres = [
  { size: 80,  top: '8%',  right: '6%',  delay: '0s',     duration: '18s' },
  { size: 56,  top: '70%', left: '4%',   delay: '-4s',    duration: '22s' },
  { size: 110, bottom: '8%', right: '14%', delay: '-8s',  duration: '26s' },
  { size: 38,  top: '22%', left: '35%',  delay: '-12s',   duration: '20s' },
  { size: 64,  top: '55%', right: '32%', delay: '-16s',   duration: '24s' },
]

// Deterministic sparkle field
function generateSparkles(count = 26) {
  const seedRand = (i, off = 0) => {
    const x = Math.sin(i * 999.137 + off) * 10000
    return x - Math.floor(x)
  }
  return Array.from({ length: count }, (_, i) => ({
    top: `${seedRand(i, 1) * 100}%`,
    left: `${seedRand(i, 2) * 100}%`,
    duration: 3 + seedRand(i, 3) * 5,
    delay: seedRand(i, 4) * -8,
    big: seedRand(i, 6) > 0.78,
  }))
}

export default function BgOrbs() {
  const auraRef = useRef(null)
  const sparkles = useMemo(() => generateSparkles(28), [])

  useEffect(() => {
    let raf = null
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let currentX = targetX
    let currentY = targetY

    const onMove = (e) => { targetX = e.clientX; targetY = e.clientY }
    const onLeave = () => { targetX = window.innerWidth / 2; targetY = window.innerHeight / 2 }

    const tick = () => {
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
      if (auraRef.current) {
        auraRef.current.style.setProperty('--mouse-x', `${currentX}px`)
        auraRef.current.style.setProperty('--mouse-y', `${currentY}px`)
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
      {/* Ambient orbs — deep, soft, almost monochrome */}
      <div className="bg-orbs">
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />
        {ambientOrbs.map((o, i) => (
          <div key={i} className="orb" style={o.style} />
        ))}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 35%, rgba(5,5,8,0.7) 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Chrome spheres — metallic accents */}
      <div className="bg-orbs" style={{ overflow: 'visible' }}>
        {chromeSpheres.map((s, i) => (
          <div
            key={i}
            className="chrome-sphere"
            style={{
              width: s.size, height: s.size,
              top: s.top, left: s.left, right: s.right, bottom: s.bottom,
              animation: `chromeFloat ${s.duration} ease-in-out infinite`,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>

      {/* Sparkle field */}
      <div className="sparkles">
        {sparkles.map((s, i) => (
          <div
            key={i}
            className={`sparkle${s.big ? ' lg' : ''}`}
            style={{
              top: s.top,
              left: s.left,
              animationDuration: `${s.duration}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Cursor aura */}
      <div ref={auraRef} className="cursor-aura" />
    </>
  )
}
