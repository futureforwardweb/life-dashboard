import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import { useUIStore } from '../../store'

const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle }
const colors = {
  success: { bg: 'rgba(109,191,138,0.13)', border: 'rgba(109,191,138,0.28)', color: 'var(--sage)', drain: 'var(--sage)' },
  error:   { bg: 'rgba(232,96,122,0.13)',  border: 'rgba(232,96,122,0.28)',  color: 'var(--rose)', drain: 'var(--rose)' },
  warning: { bg: 'rgba(240,162,74,0.13)',  border: 'rgba(240,162,74,0.28)',  color: 'var(--amber)', drain: 'var(--amber)' },
}

export default function Toast({ toast }) {
  const { removeToast } = useUIStore()
  const Icon = icons[toast.type] || CheckCircle
  const c = colors[toast.type] || colors.success

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.92, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 60, scale: 0.94, filter: 'blur(4px)' }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      className="glass toast"
      style={{
        background: c.bg,
        borderColor: c.border,
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden',
        gap: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
        <motion.div
          initial={{ scale: 0.5, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Icon size={16} color={c.color} />
        </motion.div>
        <span style={{ fontSize: '0.82rem', color: 'var(--cream)', flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
        <button
          onClick={() => removeToast(toast.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 2, opacity: 0.6, transition: 'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
        >
          <X size={13} />
        </button>
      </div>
      {/* Drain progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 3.5, ease: 'linear' }}
        style={{
          height: 2,
          background: c.drain,
          transformOrigin: 'left',
          opacity: 0.6,
        }}
      />
    </motion.div>
  )
}
