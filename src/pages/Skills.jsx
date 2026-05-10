import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Sparkles, TrendingUp } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'

const LEVELS = [
  { v: 1, l: 'Beginner' },
  { v: 2, l: 'Novice' },
  { v: 3, l: 'Intermediate' },
  { v: 4, l: 'Advanced' },
  { v: 5, l: 'Expert' },
]

export default function Skills() {
  const { skills, addSkill, updateSkill } = useLocalStore()
  const { addToast } = useUIStore()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', level: 1, hoursLogged: 0, target: '' })

  function submit() {
    if (!form.name) return
    addSkill(form)
    addToast('Skill added', 'success')
    setAdding(false)
    setForm({ name: '', category: '', level: 1, hoursLogged: 0, target: '' })
  }

  const totalHours = skills.reduce((s, sk) => s + parseFloat(sk.hoursLogged || 0), 0)
  const expertCount = skills.filter(s => s.level >= 4).length

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Skills</h1>
        <p className="page-subtitle">Track learning · log hours · level up</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="glass stat-card">
          <div className="stat-label">Skills Tracked</div>
          <div className="stat-value">{skills.length}</div>
        </div>
        <div className="glass stat-card">
          <div className="stat-label">Hours Logged</div>
          <div className="stat-value">{totalHours.toFixed(0)}</div>
          <div className="stat-sub">all-time practice</div>
        </div>
        <div className="glass stat-card">
          <div className="stat-label">Mastered</div>
          <div className="stat-value">{expertCount}</div>
          <div className="stat-sub">advanced+</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setAdding(v => !v)}>
          <Plus size={13} /> {adding ? 'Cancel' : 'Add Skill'}
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass" style={{ padding: 24, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <input className="input-base" placeholder="Skill name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="input-base" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              <select className="input-base" value={form.level} onChange={e => setForm({ ...form, level: parseInt(e.target.value) })}>
                {LEVELS.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
              </select>
              <input className="input-base" type="number" placeholder="Hours so far" value={form.hoursLogged} onChange={e => setForm({ ...form, hoursLogged: e.target.value })} />
            </div>
            <input className="input-base" placeholder="Target / goal (optional)" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} style={{ marginBottom: 12 }} />
            <button className="btn btn-primary" onClick={submit}>Save</button>
          </motion.div>
        )}
      </AnimatePresence>

      {skills.length === 0 ? (
        <div className="glass" style={{ padding: 60, textAlign: 'center' }}>
          <Sparkles size={28} style={{ opacity: 0.25, marginBottom: 14 }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>What do you want to get good at?</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {skills.map(s => {
            const lv = LEVELS.find(l => l.v === parseInt(s.level)) || LEVELS[0]
            const pct = (parseInt(s.level) / 5) * 100
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="glass glass-hover" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--cream)', fontWeight: 500, marginBottom: 2 }}>{s.name}</div>
                    {s.category && <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{s.category}</div>}
                  </div>
                  <span style={{ fontSize: '0.55rem', padding: '3px 9px', borderRadius: 99, background: 'rgba(184,174,240,0.10)', border: '1px solid rgba(184,174,240,0.18)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>
                    {lv.l}
                  </span>
                </div>
                <div className="progress-track" style={{ marginBottom: 10 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0.6), var(--accent))' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Hours</div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: 'var(--cream)' }}>{s.hoursLogged || 0}</div>
                  </div>
                  <button className="btn btn-glass" style={{ padding: '6px 12px' }}
                    onClick={() => updateSkill(s.id, { hoursLogged: parseFloat(s.hoursLogged || 0) + 1 })}>
                    <TrendingUp size={11} /> +1h
                  </button>
                </div>
                {s.target && (
                  <div style={{ fontSize: '0.66rem', color: 'var(--muted)', lineHeight: 1.5, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.55rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 700, marginRight: 6 }}>Goal</span>
                    {s.target}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
