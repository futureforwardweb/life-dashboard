import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Check, Car, ShoppingBag, Gem, Sofa } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'

const GOAL_AREAS = ['Academic','Athletic','Health','Personal','Career','Financial','Social']
const GOAL_COLORS = {
  Academic: 'var(--dusk)', Athletic: 'var(--clay)', Health: 'var(--sage)',
  Personal: 'var(--sand)', Career: 'var(--teal)', Financial: 'var(--amber)', Social: 'var(--rose)',
}

const WISHLIST_CATS = [
  { key: 'car',         label: 'Car',              icon: Car,         color: 'var(--clay)',  emoji: '🚗' },
  { key: 'clothes',     label: 'Clothes',           icon: ShoppingBag, color: 'var(--dusk)',  emoji: '👕' },
  { key: 'accessories', label: 'Accessories',       icon: Gem,         color: 'var(--amber)', emoji: '💎' },
  { key: 'room',        label: 'Room Decorations',  icon: Sofa,        color: 'var(--sage)',  emoji: '🛋️' },
]

const TABS = [
  { k: 'goals',    l: '🎯 Goals' },
  { k: 'vision',   l: '🌠 Vision Board' },
  { k: 'skills',   l: '📈 Skills' },
  { k: 'bucket',   l: '🗒️ Bucket List' },
  { k: 'wishlist', l: '🛍️ Wishlist' },
]

// ── Wishlist category card ───────────────────────────────────────────────────
function WishlistSection({ cat, items, onAdd, onToggle, onDelete }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', notes: '', priority: 'medium' })
  const Icon = cat.icon

  function submit() {
    if (!form.name) return
    onAdd({ ...form, category: cat.key })
    setForm({ name: '', price: '', notes: '', priority: 'medium' })
    setAdding(false)
  }

  const total = items.filter(i => !i.purchased).reduce((s, i) => s + parseFloat(i.price || 0), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="glass" style={{ padding: 24 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `${cat.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} color={cat.color} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--cream)' }}>
              {cat.emoji} {cat.label}
            </div>
            {total > 0 && (
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 1 }}>
                ~${total.toFixed(0)} remaining to spend
              </div>
            )}
          </div>
        </div>
        <button
          className="btn btn-ghost"
          style={{ padding: '6px 12px', fontSize: '0.7rem' }}
          onClick={() => setAdding(v => !v)}
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-sm" style={{ padding: 16, marginBottom: 16, overflow: 'hidden' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
              <input
                className="input-base"
                placeholder="Item name…"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && submit()}
              />
              <input
                className="input-base"
                placeholder="$price"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                style={{ width: 90 }}
                type="number"
              />
            </div>
            <input
              className="input-base"
              placeholder="Notes, link, or reason…"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="input-base" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ flex: 1 }}>
                <option value="urgent">🔴 Must have</option>
                <option value="high">🟠 Really want</option>
                <option value="medium">🟡 Would be nice</option>
                <option value="low">🟢 Someday</option>
              </select>
              <button className="btn btn-primary" onClick={submit} style={{ padding: '10px 20px' }}>Add</button>
              <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {items.length === 0 && !adding ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '16px 0', fontSize: '0.78rem' }}>
              Nothing on the list yet.
            </div>
          ) : items.map(item => {
            const pc = { urgent: 'var(--rose)', high: 'var(--clay)', medium: 'var(--amber)', low: 'var(--sage)' }
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10,
                  background: item.purchased ? 'rgba(109,191,138,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${item.purchased ? 'rgba(109,191,138,0.2)' : 'var(--border)'}`,
                }}
              >
                <button
                  onClick={() => onToggle(item.id)}
                  style={{
                    width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${item.purchased ? 'var(--sage)' : 'var(--border2)'}`,
                    background: item.purchased ? 'var(--sage)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                  }}
                >
                  {item.purchased && <Check size={11} color="#fff" />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.85rem', color: item.purchased ? 'var(--muted)' : 'var(--cream)',
                    fontWeight: 500,
                    textDecoration: item.purchased ? 'line-through' : 'none',
                  }}>
                    {item.name}
                  </div>
                  {item.notes && (
                    <div style={{ fontSize: '0.62rem', color: 'var(--muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {item.price && (
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: item.purchased ? 'var(--muted)' : cat.color }}>
                      ${parseFloat(item.price).toFixed(0)}
                    </span>
                  )}
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: pc[item.priority] || 'var(--muted)',
                    flexShrink: 0,
                  }} />
                  <button
                    onClick={() => onDelete(item.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.5, padding: 2 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Goals() {
  const {
    goals, addGoal, updateGoal, deleteGoal,
    visionItems, addVisionItem, deleteVisionItem,
    skills, addSkill, updateSkill,
    bucketList, addBucketItem, toggleBucketItem,
    wishlist, addWishlistItem, toggleWishlistPurchased, deleteWishlistItem,
    tasks,
  } = useLocalStore()
  const { addToast } = useUIStore()
  const [tab, setTab] = useState('goals')
  const [goalForm, setGoalForm] = useState({ title: '', area: 'Academic', description: '', targetDate: '', milestones: '' })
  const [visionForm, setVisionForm] = useState({ title: '', imageUrl: '', category: 'Academic', description: '' })
  const [skillForm, setSkillForm] = useState({ name: '', category: '', level: 0, notes: '' })
  const [bucketForm, setBucketForm] = useState({ item: '' })

  function submitGoal() {
    if (!goalForm.title) return
    addGoal({ ...goalForm, color: GOAL_COLORS[goalForm.area] || 'var(--dusk)', progress: 0 })
    addToast('Goal added', 'success')
    setGoalForm({ title: '', area: 'Academic', description: '', targetDate: '', milestones: '' })
  }

  function submitVision() {
    if (!visionForm.title) return
    addVisionItem(visionForm)
    addToast('Added to vision board', 'success')
    setVisionForm({ title: '', imageUrl: '', category: 'Academic', description: '' })
  }

  function submitSkill() {
    if (!skillForm.name) return
    addSkill(skillForm)
    addToast('Skill added', 'success')
    setSkillForm({ name: '', category: '', level: 0, notes: '' })
  }

  function submitBucket() {
    if (!bucketForm.item) return
    addBucketItem({ item: bucketForm.item })
    addToast('Added to bucket list', 'success')
    setBucketForm({ item: '' })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Goals <em style={{ fontStyle: 'italic', color: 'var(--sand)' }}>&amp; Growth</em></h1>
        <p className="page-subtitle">Vision board, life goals, skills, bucket list &amp; wishlist</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(({ k, l }) => (
          <button key={k} onClick={() => setTab(k)} style={{
            fontSize: '0.65rem', padding: '7px 16px', borderRadius: 99,
            border: '1px solid',
            textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
            borderColor: tab === k ? 'var(--dusk)' : 'var(--border)',
            background: tab === k ? 'rgba(155,143,212,0.15)' : 'transparent',
            color: tab === k ? 'var(--dusk)' : 'var(--muted)',
            transition: 'all 0.2s',
          }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Goals ── */}
      {tab === 'goals' && (
        <>
          <div className="glass-sm" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 12 }}>
              New Goal
            </div>
            <div className="grid-2" style={{ gap: 8, marginBottom: 8 }}>
              <input className="input-base" placeholder="Goal title" value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} />
              <select className="input-base" value={goalForm.area} onChange={e => setGoalForm({ ...goalForm, area: e.target.value })}>
                {GOAL_AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
              <input type="date" className="input-base" value={goalForm.targetDate} onChange={e => setGoalForm({ ...goalForm, targetDate: e.target.value })} />
            </div>
            <textarea className="input-base" placeholder="Description &amp; why this matters" rows={2} value={goalForm.description} onChange={e => setGoalForm({ ...goalForm, description: e.target.value })} style={{ marginBottom: 8, resize: 'vertical' }} />
            <button className="btn btn-primary" onClick={submitGoal}>Add Goal</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {GOAL_AREAS.map(area => {
              const areaGoals = goals.filter(g => g.area === area)
              if (!areaGoals.length) return null
              return (
                <motion.div key={area} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: 20 }}>
                  <div style={{ fontSize: '0.62rem', color: GOAL_COLORS[area] || 'var(--dusk)', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 600, marginBottom: 14 }}>
                    {area}
                  </div>
                  {areaGoals.map(g => {
                    const linkedTasks = tasks.filter(t => t.goalId === g.id)
                    const linkedDone = linkedTasks.filter(t => t.completed).length
                    const autoLinked = linkedTasks.length > 0
                    return (
                    <div key={g.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.88rem', color: 'var(--cream)', fontWeight: 500, marginBottom: 3 }}>{g.title}</div>
                          {g.description && <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.5 }}>{g.description}</div>}
                          <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                            {g.targetDate && <div style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>Target: {g.targetDate}</div>}
                            {autoLinked && (
                              <div style={{ fontSize: '0.6rem', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: 'rgba(184,174,240,0.10)', border: '1px solid rgba(184,174,240,0.18)', fontWeight: 700 }}>
                                ↗ {linkedDone}/{linkedTasks.length} linked tasks
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={() => deleteGoal(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.5 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="progress-track" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${g.progress || 0}%`, background: GOAL_COLORS[area] || 'var(--dusk)' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {autoLinked ? (
                            <span title="Progress auto-derived from linked task completion" style={{ fontSize: '0.55rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 700 }}>auto</span>
                          ) : (
                            <input type="range" min={0} max={100} value={g.progress || 0} onChange={e => updateGoal(g.id, { progress: +e.target.value })} style={{ width: 80, accentColor: GOAL_COLORS[area] || 'var(--dusk)' }} />
                          )}
                          <span style={{ fontSize: '0.68rem', color: GOAL_COLORS[area] || 'var(--dusk)', fontWeight: 600, width: 30 }}>{g.progress || 0}%</span>
                        </div>
                      </div>
                    </div>
                  )})}
                </motion.div>
              )
            })}
            {goals.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: '0.82rem' }}>
                No goals yet — what are you working towards?
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Vision Board ── */}
      {tab === 'vision' && (
        <>
          <div className="glass-sm" style={{ padding: 20, marginBottom: 20 }}>
            <div className="grid-2" style={{ gap: 8, marginBottom: 8 }}>
              <input className="input-base" placeholder="Title / caption" value={visionForm.title} onChange={e => setVisionForm({ ...visionForm, title: e.target.value })} />
              <select className="input-base" value={visionForm.category} onChange={e => setVisionForm({ ...visionForm, category: e.target.value })}>
                {GOAL_AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
              <input className="input-base" placeholder="Image URL (optional)" value={visionForm.imageUrl} onChange={e => setVisionForm({ ...visionForm, imageUrl: e.target.value })} style={{ gridColumn: '1/-1' }} />
              <textarea className="input-base" placeholder="Why this? What does it mean to you?" rows={2} value={visionForm.description} onChange={e => setVisionForm({ ...visionForm, description: e.target.value })} style={{ gridColumn: '1/-1', resize: 'vertical' }} />
            </div>
            <button className="btn btn-primary" onClick={submitVision}>Add to Board</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {visionItems.map(v => (
              <motion.div key={v.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
                {v.imageUrl
                  ? <img src={v.imageUrl} alt={v.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                  : <div style={{ height: 100, background: `${GOAL_COLORS[v.category] || 'var(--dusk)'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>✦</div>
                }
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>{v.title}</div>
                  <div style={{ fontSize: '0.62rem', color: GOAL_COLORS[v.category] || 'var(--dusk)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{v.category}</div>
                  {v.description && <div style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.5 }}>{v.description}</div>}
                  <button onClick={() => deleteVisionItem(v.id)} style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.65rem', padding: 0 }}>Remove</button>
                </div>
              </motion.div>
            ))}
            {visionItems.length === 0 && (
              <div style={{ color: 'var(--muted)', fontSize: '0.82rem', gridColumn: '1/-1', textAlign: 'center', padding: '32px 0' }}>
                Vision board is empty. Add things you're working towards.
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Skills ── */}
      {tab === 'skills' && (
        <>
          <div className="glass-sm" style={{ padding: 20, marginBottom: 20 }}>
            <div className="grid-2" style={{ gap: 8, marginBottom: 8 }}>
              <input className="input-base" placeholder="Skill name (e.g. Piano, Python)" value={skillForm.name} onChange={e => setSkillForm({ ...skillForm, name: e.target.value })} />
              <input className="input-base" placeholder="Category" value={skillForm.category} onChange={e => setSkillForm({ ...skillForm, category: e.target.value })} />
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--muted)', marginBottom: 4 }}>
                  <span>Current level</span><span style={{ color: 'var(--cream)', fontWeight: 600 }}>{skillForm.level}%</span>
                </div>
                <input type="range" min={0} max={100} value={skillForm.level} onChange={e => setSkillForm({ ...skillForm, level: +e.target.value })} style={{ width: '100%', accentColor: 'var(--teal)' }} />
              </div>
              <textarea className="input-base" placeholder="Notes" rows={2} value={skillForm.notes} onChange={e => setSkillForm({ ...skillForm, notes: e.target.value })} style={{ resize: 'vertical', gridColumn: '1/-1' }} />
            </div>
            <button className="btn btn-primary" onClick={submitSkill}>Add Skill</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
            {skills.map(s => (
              <div key={s.id} className="glass" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--cream)', fontWeight: 600 }}>{s.name}</div>
                    {s.category && <div style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>{s.category}</div>}
                  </div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'var(--teal)' }}>{s.level}%</div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${s.level}%`, background: 'linear-gradient(90deg, var(--teal), var(--dusk))' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <input type="range" min={0} max={100} value={s.level} onChange={e => updateSkill(s.id, { level: +e.target.value })} style={{ flex: 1, accentColor: 'var(--teal)' }} />
                </div>
              </div>
            ))}
            {skills.length === 0 && (
              <div style={{ color: 'var(--muted)', fontSize: '0.82rem', gridColumn: '1/-1', textAlign: 'center', padding: '32px 0' }}>
                No skills tracked yet
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Bucket List ── */}
      {tab === 'bucket' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input
              className="input-base"
              placeholder="Something you want to do, see or experience…"
              value={bucketForm.item}
              onChange={e => setBucketForm({ item: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && submitBucket()}
            />
            <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={submitBucket}>
              <Plus size={16} /> Add
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bucketList.map(b => (
              <motion.div key={b.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <button onClick={() => toggleBucketItem(b.id)} className="checkbox" style={{ background: b.completed ? 'var(--sage)' : undefined, borderColor: b.completed ? 'var(--sage)' : undefined }}>
                  {b.completed && <span style={{ fontSize: 9, color: '#fff' }}>✓</span>}
                </button>
                <span style={{ flex: 1, fontSize: '0.85rem', color: b.completed ? 'var(--muted)' : 'var(--cream)', textDecoration: b.completed ? 'line-through' : 'none', fontWeight: 500 }}>
                  {b.item}
                </span>
              </motion.div>
            ))}
            {bucketList.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: '0.82rem' }}>
                Nothing on the list yet — dream bigger.
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Wishlist / What I Want to Buy ── */}
      {tab === 'wishlist' && (
        <div>
          {/* Summary bar */}
          {wishlist.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {WISHLIST_CATS.map(cat => {
                const catItems = wishlist.filter(w => w.category === cat.key)
                const unpurchased = catItems.filter(i => !i.purchased)
                const purchased = catItems.filter(i => i.purchased)
                if (catItems.length === 0) return null
                return (
                  <div key={cat.key} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px', borderRadius: 99,
                    background: `${cat.color}10`,
                    border: `1px solid ${cat.color}25`,
                  }}>
                    <span style={{ fontSize: '0.9rem' }}>{cat.emoji}</span>
                    <span style={{ fontSize: '0.72rem', color: cat.color, fontWeight: 600 }}>{cat.label}</span>
                    <span style={{ fontSize: '0.66rem', color: 'var(--muted)' }}>{purchased.length}/{catItems.length} bought</span>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {WISHLIST_CATS.map(cat => (
              <WishlistSection
                key={cat.key}
                cat={cat}
                items={wishlist.filter(w => w.category === cat.key)}
                onAdd={(item) => { addWishlistItem(item); addToast(`Added to ${cat.label}`, 'success') }}
                onToggle={toggleWishlistPurchased}
                onDelete={deleteWishlistItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
