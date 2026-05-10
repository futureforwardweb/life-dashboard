import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Star, Mountain, MapPin } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'

const CATEGORIES = ['Travel', 'Adventure', 'Achievement', 'Experience', 'Personal', 'Career', 'Other']

export default function BucketList() {
  const { bucketList, addBucketItem, toggleBucketItem } = useLocalStore()
  const { addToast } = useUIStore()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'Experience', targetDate: '' })

  const completed = bucketList.filter(b => b.completed).length
  const total = bucketList.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  function submit() {
    if (!form.title) return
    addBucketItem(form)
    addToast('Added to bucket list', 'success')
    setAdding(false)
    setForm({ title: '', description: '', category: 'Experience', targetDate: '' })
  }

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = bucketList.filter(b => b.category === cat)
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bucket List</h1>
        <p className="page-subtitle">Things to do · places to go · experiences to chase</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="glass glass-premium" style={{ padding: 32, marginBottom: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.24em', fontWeight: 700, marginBottom: 10 }}>Lifetime Progress</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <div className="holographic" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '4rem', fontWeight: 300, lineHeight: 0.9 }}>{completed}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: 'var(--muted)', fontStyle: 'italic' }}>of {total} dreams</div>
            </div>
          </div>
          <div style={{ minWidth: 240, flex: 1, maxWidth: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--muted)', marginBottom: 6 }}>
              <span>{pct}% complete</span>
              <span>{total - completed} to go</span>
            </div>
            <div className="progress-track" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0.7), var(--accent))' }} />
            </div>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setAdding(v => !v)}>
          <Plus size={13} /> {adding ? 'Cancel' : 'Add Dream'}
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass" style={{ padding: 24, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <input className="input-base" placeholder="Dream / experience" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <select className="input-base" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="input-base" type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} />
            </div>
            <textarea className="input-base" placeholder="Description / why this matters…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ marginBottom: 12, resize: 'vertical' }} />
            <button className="btn btn-primary" onClick={submit}>Save</button>
          </motion.div>
        )}
      </AnimatePresence>

      {bucketList.length === 0 ? (
        <div className="glass" style={{ padding: 60, textAlign: 'center' }}>
          <Mountain size={28} style={{ opacity: 0.25, marginBottom: 14 }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            Nothing yet. What do you want to do before you die?
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {CATEGORIES.map(cat => grouped[cat].length > 0 && (
            <div key={cat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 700 }}>{cat}</span>
                <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{grouped[cat].filter(b => b.completed).length}/{grouped[cat].length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {grouped[cat].map(item => (
                  <motion.div
                    key={item.id} layout
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    onClick={() => toggleBucketItem(item.id)}
                    className="glass glass-hover"
                    style={{ padding: 18, cursor: 'pointer', opacity: item.completed ? 0.55 : 1 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: item.completed ? 'var(--cream)' : 'transparent',
                        border: `1.5px solid ${item.completed ? 'var(--cream)' : 'var(--border3)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 1, transition: 'all 0.2s',
                      }}>
                        {item.completed && <Star size={11} color="#0a0a14" fill="#0a0a14" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.86rem', color: 'var(--cream)', fontWeight: 500, textDecoration: item.completed ? 'line-through' : 'none', marginBottom: 4 }}>
                          {item.title}
                        </div>
                        {item.description && (
                          <div style={{ fontSize: '0.66rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 6 }}>{item.description}</div>
                        )}
                        {item.targetDate && (
                          <div style={{ fontSize: '0.58rem', color: 'var(--muted2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={9} /> by {item.targetDate}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
