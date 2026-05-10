import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, X, TrendingUp, TrendingDown, AlertTriangle, Info, ChevronRight, Bell } from 'lucide-react'
import { useLocalStore } from '../../store'
import { generateInsights } from '../../lib/insights'

const SEV_STYLES = {
  urgent:    { color: 'var(--danger)',  Icon: AlertTriangle, bg: 'rgba(232,132,152,0.10)', border: 'rgba(232,132,152,0.25)' },
  attention: { color: 'var(--warning)', Icon: TrendingDown,  bg: 'rgba(232,181,116,0.10)', border: 'rgba(232,181,116,0.22)' },
  positive:  { color: 'var(--positive)',Icon: TrendingUp,    bg: 'rgba(143,199,163,0.10)', border: 'rgba(143,199,163,0.22)' },
  neutral:   { color: 'var(--muted)',   Icon: Info,          bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)' },
}

export default function InsightsDrawer() {
  const [open, setOpen] = useState(false)
  const store = useLocalStore()
  const navigate = useNavigate()

  const insights = useMemo(() => generateInsights(store), [store])
  const urgentCount = insights.filter(i => i.severity === 'urgent').length
  const attentionCount = insights.filter(i => i.severity === 'attention').length

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="glass"
        style={{
          position: 'fixed',
          bottom: 24, left: 24,
          zIndex: 90,
          width: 48, height: 48,
          borderRadius: 14,
          padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--cream)',
          border: 'none',
        }}
        title={`${insights.length} insight${insights.length !== 1 ? 's' : ''}`}
      >
        <Sparkles size={16} />
        {(urgentCount + attentionCount) > 0 && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            width: 8, height: 8, borderRadius: '50%',
            background: urgentCount > 0 ? 'var(--danger)' : 'var(--warning)',
            boxShadow: `0 0 10px ${urgentCount > 0 ? 'rgba(232,132,152,0.7)' : 'rgba(232,181,116,0.7)'}`,
          }} />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
              }}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="glass"
              style={{
                position: 'fixed',
                top: 16, right: 16, bottom: 16,
                width: 'min(440px, 90vw)',
                zIndex: 101,
                padding: 0,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ padding: '24px 26px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.26em', fontWeight: 700 }}>
                    Smart Insights
                  </div>
                  <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--cream)' }}>
                    <X size={13} />
                  </button>
                </div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.7rem', color: 'var(--cream)', fontWeight: 400, lineHeight: 1.1 }}>
                  {insights.length === 0
                    ? 'All clear.'
                    : urgentCount > 0
                    ? `${urgentCount} thing${urgentCount !== 1 ? 's' : ''} need${urgentCount === 1 ? 's' : ''} attention`
                    : `${insights.length} observation${insights.length !== 1 ? 's' : ''}`}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 6 }}>
                  Auto-generated from your data, refreshed live.
                </div>
              </div>

              {/* Insights list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 24px' }}>
                {insights.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
                    <Sparkles size={28} style={{ opacity: 0.25, marginBottom: 14 }} />
                    <div style={{ fontSize: '0.86rem', color: 'var(--cream)', marginBottom: 8 }}>Nothing to flag.</div>
                    <div style={{ fontSize: '0.72rem' }}>Things are running smoothly.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {insights.map((it, i) => {
                      const sev = SEV_STYLES[it.severity] || SEV_STYLES.neutral
                      const Icon = sev.Icon
                      return (
                        <motion.div
                          key={it.id}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.4 }}
                          style={{
                            background: sev.bg,
                            border: `1px solid ${sev.border}`,
                            borderRadius: 14,
                            padding: '14px 16px',
                            position: 'relative',
                            cursor: it.action ? 'pointer' : 'default',
                          }}
                          onClick={() => {
                            if (it.action?.route) {
                              navigate(it.action.route)
                              setOpen(false)
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 8,
                              background: 'rgba(0,0,0,0.3)',
                              border: `1px solid ${sev.border}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <Icon size={13} color={sev.color} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', color: 'var(--cream)', fontWeight: 500, marginBottom: 4 }}>
                                {it.title}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: it.action ? 8 : 0 }}>
                                {it.body}
                              </div>
                              {it.action && (
                                <div style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  fontSize: '0.62rem', color: sev.color,
                                  textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700,
                                }}>
                                  {it.action.label} <ChevronRight size={11} />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
