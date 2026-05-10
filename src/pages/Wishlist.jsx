import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ShoppingBag, Check, ExternalLink } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'

const PRIORITIES = [
  { v: 'must',   l: 'Must have',  c: 'var(--danger)' },
  { v: 'want',   l: 'Want',       c: 'var(--accent-warm)' },
  { v: 'maybe',  l: 'Maybe',      c: 'var(--muted)' },
]

export default function Wishlist() {
  const { wishlist, addWishlistItem, updateWishlistItem, deleteWishlistItem, toggleWishlistPurchased } = useLocalStore()
  const { addToast } = useUIStore()
  const [adding, setAdding] = useState(false)
  const [tab, setTab] = useState('open')
  const [form, setForm] = useState({ name: '', price: '', url: '', priority: 'want', notes: '' })

  const filtered = wishlist.filter(w => tab === 'open' ? !w.purchased : w.purchased)
  const totalCost = useMemo(() => wishlist.filter(w => !w.purchased).reduce((s, w) => s + parseFloat(w.price || 0), 0), [wishlist])
  const purchasedCount = wishlist.filter(w => w.purchased).length

  function submit() {
    if (!form.name) return
    addWishlistItem(form)
    addToast('Added to wishlist', 'success')
    setAdding(false)
    setForm({ name: '', price: '', url: '', priority: 'want', notes: '' })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Wishlist</h1>
        <p className="page-subtitle">Things to save for · {wishlist.length} item{wishlist.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="glass stat-card">
          <div className="stat-label">Total To Buy</div>
          <div className="stat-value">${totalCost.toFixed(0)}</div>
          <div className="stat-sub">{wishlist.filter(w => !w.purchased).length} open items</div>
        </div>
        <div className="glass stat-card">
          <div className="stat-label">Purchased</div>
          <div className="stat-value">{purchasedCount}</div>
          <div className="stat-sub">all-time</div>
        </div>
        <div className="glass stat-card">
          <div className="stat-label">Must Haves</div>
          <div className="stat-value">{wishlist.filter(w => w.priority === 'must' && !w.purchased).length}</div>
          <div className="stat-sub">priority items</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {[['open', 'Open'], ['done', 'Purchased']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '7px 16px', borderRadius: 99, border: '1px solid', cursor: 'pointer',
            fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700,
            borderColor: tab === k ? 'rgba(255,255,255,0.25)' : 'var(--border)',
            background: tab === k ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: tab === k ? 'var(--cream)' : 'var(--muted)',
          }}>{l}</button>
        ))}
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setAdding(v => !v)}>
          <Plus size={13} /> {adding ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass" style={{ padding: 24, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <input className="input-base" placeholder="Item name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="input-base" type="number" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              <select className="input-base" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
              </select>
            </div>
            <input className="input-base" placeholder="URL (optional)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} style={{ marginBottom: 10 }} />
            <input className="input-base" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ marginBottom: 12 }} />
            <button className="btn btn-primary" onClick={submit}>Save</button>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <div className="glass" style={{ padding: 60, textAlign: 'center' }}>
          <ShoppingBag size={28} style={{ opacity: 0.25, marginBottom: 14 }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            {tab === 'open' ? 'Nothing on the wishlist yet.' : 'No purchases recorded yet.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          <AnimatePresence>
            {filtered.map(w => {
              const p = PRIORITIES.find(p => p.v === w.priority) || PRIORITIES[1]
              return (
                <motion.div key={w.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="glass" style={{ padding: 22, opacity: w.purchased ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.55rem', padding: '3px 9px', borderRadius: 99, background: `${p.c}18`, border: `1px solid ${p.c}30`, color: p.c, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>
                      {p.l}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => toggleWishlistPurchased(w.id)} title={w.purchased ? 'Unmark' : 'Mark purchased'}
                        style={{ width: 24, height: 24, borderRadius: 6, background: w.purchased ? 'rgba(143,199,163,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${w.purchased ? 'rgba(143,199,163,0.3)' : 'var(--border)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={11} color={w.purchased ? 'var(--positive)' : 'var(--muted)'} />
                      </button>
                      <button onClick={() => deleteWishlistItem(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted2)', padding: 4 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--cream)', fontWeight: 500, marginBottom: 4, textDecoration: w.purchased ? 'line-through' : 'none' }}>
                    {w.name}
                  </div>
                  {w.price && (
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: 'var(--cream)', lineHeight: 1.2 }}>
                      ${parseFloat(w.price).toFixed(2)}
                    </div>
                  )}
                  {w.notes && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>{w.notes}</div>
                  )}
                  {w.url && (
                    <a href={w.url} target="_blank" rel="noopener noreferrer"
                      style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.64rem', color: 'var(--accent)', textDecoration: 'none' }}>
                      <ExternalLink size={10} /> View link
                    </a>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
