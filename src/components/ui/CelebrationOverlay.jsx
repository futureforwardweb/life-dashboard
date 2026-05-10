import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { onCelebrate } from '../../lib/celebrate'

const PARTICLE_COUNTS = { task: 8, habit: 12, goal: 18 }

export default function CelebrationOverlay() {
  const [bursts, setBursts] = useState([])

  useEffect(() => {
    return onCelebrate(event => {
      const count = PARTICLE_COUNTS[event.variant] ?? 8
      const particles = Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4
        const dist = 50 + Math.random() * 60
        return {
          id: `${event.id}-${i}`,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          delay: Math.random() * 0.06,
          size: 3 + Math.random() * 3,
        }
      })
      const burst = { ...event, particles }
      setBursts(b => [...b, burst])
      setTimeout(() => {
        setBursts(b => b.filter(x => x.id !== burst.id))
      }, 1400)
    })
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      <AnimatePresence>
        {bursts.map(burst => (
          <div key={burst.id} style={{ position: 'absolute', left: burst.x, top: burst.y }}>
            {burst.particles.map(p => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: p.dx,
                  y: p.dy,
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0.4],
                }}
                transition={{
                  duration: 0.9 + Math.random() * 0.3,
                  delay: p.delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  position: 'absolute',
                  width: p.size, height: p.size,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 0 12px rgba(255,255,255,0.9), 0 0 24px rgba(184,174,240,0.6)',
                }}
              />
            ))}

            {/* Center ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                width: 30, height: 30,
                marginLeft: -15, marginTop: -15,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.7)',
              }}
            />

            {burst.message && (
              <motion.div
                initial={{ y: 0, opacity: 0, scale: 0.8 }}
                animate={{ y: -50, opacity: [0, 1, 1, 0], scale: 1 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute',
                  left: '50%', top: 0,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1.2rem', color: '#fff',
                  fontStyle: 'italic',
                  whiteSpace: 'nowrap',
                  textShadow: '0 0 12px rgba(184,174,240,0.6)',
                  pointerEvents: 'none',
                }}
              >
                {burst.message}
              </motion.div>
            )}
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
