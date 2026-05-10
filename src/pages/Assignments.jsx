import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Clock, BookOpen, AlertTriangle, CheckCircle, Timer } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'
import { dateAWST, relativeDay, formatAWST } from '../lib/time'
import { differenceInDays } from 'date-fns'

const STATUS = { pending: 'var(--amber)', submitted: 'var(--teal)', graded: 'var(--sage)', missed: 'var(--rose)' }
const STATUS_BG = { pending: 'rgba(240,162,74,0.12)', submitted: 'rgba(78,201,184,0.12)', graded: 'rgba(109,191,138,0.12)', missed: 'rgba(232,96,122,0.12)' }
const PRIORITY = { urgent: 'var(--rose)', high: 'var(--clay)', normal: 'var(--dusk)', low: 'var(--muted)' }

export default function Assignments() {
  const { assignments, addAssignment, updateAssignment, deleteAssignment, subjects, studySessions, addStudySession } = useLocalStore()
  const { addToast } = useUIStore()
  const [adding, setAdding] = useState(false)
  const [loggingStudy, setLoggingStudy] = useState(false)
  const [filter, setFilter] = useState('pending')
  const [form, setForm] = useState({ title: '', subjectId: '', dueDate: '', priority: 'normal', type: 'assignment', notes: '' })
  const [studyForm, setStudyForm] = useState({ subjectId: '', duration: 60, notes: '' })
  const today = dateAWST()

  const filtered = assignments.filter(a => filter === 'all' ? true : a.status === filter)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))

  const overdue = assignments.filter(a => a.status === 'pending' && a.dueDate < today)
  const dueThisWeek = assignments.filter(a => {
    if (a.status !== 'pending') return false
    const diff = differenceInDays(new Date(a.dueDate + 'T12:00:00'), new Date())
    return diff >= 0 && diff <= 7
  })

  const studyDays = [...new Set(studySessions.map(s => s.date?.split('T')[0]))].sort().reverse()
  let studyStreak = 0
  for (let i = 0; i < studyDays.length; i++) {
    const expected = new Date(); expected.setDate(expected.getDate() - i)
    if (studyDays[i] === expected.toISOString().split('T')[0]) studyStreak++
    else break
  }

  const totalStudyHours = studySessions.reduce((s, sess) => s + (sess.duration || 0), 0)

  function submit() {
    if (!form.title || !form.dueDate) return
    addAssignment(form)
    addToast('Assignment added', 'success')
    setAdding(false)
    setForm({ title: '', subjectId: '', dueDate: '', priority: 'normal', type: 'assignment', notes: '' })
  }

  function submitStudy() {
    if (!studyForm.subjectId) return
    addStudySession({ ...studyForm, date: new Date().toISOString() })
    addToast(`${studyForm.duration}min study logged`, 'success')
    setLoggingStudy(false)
    setStudyForm({ subjectId: '', duration: 60, notes: '' })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Assignments <em style={{ fontStyle: 'italic', color: 'var(--sand)' }}>&amp; Study</em></h1>
        <p className="page-subtitle">SAC deadlines, homework &amp; study sessions</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Pending', value: assignments.filter(a => a.status === 'pending').length, color: 'var(--amber)', icon: Clock },
          { label: 'Overdue', value: overdue.length, color: 'var(--rose)', icon: AlertTriangle },
          { label: 'Due This Week', value: dueThisWeek.length, color: 'var(--clay)', icon: BookOpen },
          { label: 'Study Streak', value: `${studyStreak}d`, color: 'var(--sage)', icon: CheckCircle },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="glass stat-card" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
              <s.icon size={18} color={s.color} style={{ opacity: 0.5 }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: '12px 20px', marginBottom: 20, borderLeft: '3px solid var(--rose)', background: 'rgba(232,96,122,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={15} color="var(--rose)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--rose)', fontWeight: 600 }}>{overdue.length} overdue assignment{overdue.length > 1 ? 's' : ''}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>— {overdue.map(a => a.title).join(', ')}</span>
          </div>
        </motion.div>
      )}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Assignment list */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass" style={{ padding: 24 }}>
          <div className="section-header" style={{ flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {['pending', 'submitted', 'graded', 'all'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  fontSize: '0.6rem', padding: '4px 10px', borderRadius: 99, border: '1px solid',
                  textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                  borderColor: filter === f ? 'var(--dusk)' : 'var(--border)',
                  background: filter === f ? 'rgba(155,143,212,0.15)' : 'transparent',
                  color: filter === f ? 'var(--dusk)' : 'var(--muted)',
                }}>{f}</button>
              ))}
            </div>
            <button className="btn btn-primary" style={{ padding: '7px 14px' }} onClick={() => setAdding(v => !v)}>
              <Plus size={14} /> {adding ? 'Cancel' : 'Add'}
            </button>
          </div>

          <AnimatePresence>
            {adding && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="glass-sm" style={{ padding: 16, marginBottom: 16, overflow: 'hidden' }}>
                <input className="input-base" placeholder="Assignment title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ marginBottom: 8 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <select className="input-base" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}>
                    <option value="">Subject…</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select className="input-base" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {['assignment', 'SAC', 'exam', 'project', 'essay', 'practical', 'other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input type="date" className="input-base" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                  <select className="input-base" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {['urgent', 'high', 'normal', 'low'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <textarea className="input-base" placeholder="Notes" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ marginBottom: 8, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={submit} style={{ flex: 1 }}>Add Assignment</button>
                  <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: '0.82rem' }}>
                {filter === 'pending' ? "You're clear — no pending assignments." : 'Nothing here.'}
              </div>
            )}
            {filtered.map(a => {
              const sub = subjects.find(s => s.id === a.subjectId)
              const daysLeft = a.dueDate ? differenceInDays(new Date(a.dueDate + 'T12:00:00'), new Date()) : null
              const isUrgent = daysLeft !== null && daysLeft < 3 && a.status === 'pending'
              return (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                  style={{ padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 3, alignSelf: 'stretch', minHeight: 42, borderRadius: 99, background: STATUS[a.status] || 'var(--border)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.88rem', color: 'var(--cream)', fontWeight: 500 }}>{a.title}</span>
                        <span style={{ fontSize: '0.56rem', padding: '2px 7px', borderRadius: 99,
                          background: `${PRIORITY[a.priority] || 'var(--muted)'}18`,
                          color: PRIORITY[a.priority] || 'var(--muted)',
                          border: `1px solid ${PRIORITY[a.priority] || 'var(--muted)'}30`,
                          textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                          {a.priority}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontSize: '0.62rem', color: 'var(--muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                        {sub && <span style={{ fontWeight: 500, color: 'var(--dusk)' }}>{sub.code || sub.name}</span>}
                        <span style={{ textTransform: 'capitalize', opacity: 0.8 }}>{a.type}</span>
                        {a.dueDate && (
                          <span style={{ color: isUrgent ? 'var(--rose)' : daysLeft !== null && daysLeft < 7 ? 'var(--amber)' : 'var(--muted)', fontWeight: isUrgent ? 600 : 400 }}>
                            {isUrgent && '⚡ '}Due {relativeDay(a.dueDate)}
                            {daysLeft !== null && ` (${daysLeft < 0 ? 'overdue' : daysLeft + 'd left'})`}
                          </span>
                        )}
                      </div>
                      {a.notes && <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{a.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
                      <select value={a.status} onChange={e => updateAssignment(a.id, { status: e.target.value })}
                        style={{ fontSize: '0.6rem', background: STATUS_BG[a.status] || 'rgba(255,255,255,0.05)', border: `1px solid ${STATUS[a.status] || 'var(--border)'}40`, color: STATUS[a.status] || 'var(--muted)', borderRadius: 7, padding: '4px 7px', cursor: 'pointer' }}>
                        {Object.keys(STATUS).map(s => <option key={s}>{s}</option>)}
                      </select>
                      <button onClick={() => deleteAssignment(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.45, padding: 3 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {/* Study session log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass" style={{ padding: 24 }}>
            <div className="section-header">
              <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Timer size={13} /> Study Log
              </span>
              <button className="btn btn-primary" style={{ padding: '7px 14px' }} onClick={() => setLoggingStudy(v => !v)}>
                <Plus size={14} /> {loggingStudy ? 'Cancel' : 'Log Session'}
              </button>
            </div>

            {/* Study summary */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 18, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>Total Hours</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: 'var(--dusk)' }}>
                  {(totalStudyHours / 60).toFixed(1)}<span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 2 }}>h</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>Streak</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: studyStreak > 0 ? 'var(--clay)' : 'var(--muted)' }}>
                  {studyStreak}<span style={{ fontSize: '0.8rem', marginLeft: 2 }}>d</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>Sessions</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: 'var(--sage)' }}>
                  {studySessions.length}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {loggingStudy && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="glass-sm" style={{ padding: 16, marginBottom: 16, overflow: 'hidden' }}>
                  <select className="input-base" value={studyForm.subjectId} onChange={e => setStudyForm({ ...studyForm, subjectId: e.target.value })} style={{ marginBottom: 10 }}>
                    <option value="">Select subject…</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--muted)', marginBottom: 6 }}>
                      <span>Duration</span>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: 'var(--dusk)' }}>{studyForm.duration}min</span>
                    </div>
                    <input type="range" min={15} max={240} step={15} value={studyForm.duration} onChange={e => setStudyForm({ ...studyForm, duration: +e.target.value })} style={{ width: '100%', accentColor: 'var(--dusk)' }} />
                  </div>
                  <textarea className="input-base" placeholder="What did you study?" rows={2} value={studyForm.notes} onChange={e => setStudyForm({ ...studyForm, notes: e.target.value })} style={{ marginBottom: 10, resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={submitStudy} style={{ flex: 1 }}>Log Session</button>
                    <button className="btn btn-ghost" onClick={() => setLoggingStudy(false)}>Cancel</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {studySessions.slice(0, 8).map(s => {
                const sub = subjects.find(sub => sub.id === s.subjectId)
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(155,143,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.85rem', color: 'var(--dusk)', fontWeight: 600 }}>{s.duration}m</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--cream)', fontWeight: 500 }}>{sub?.name || 'General Study'}</div>
                      {s.notes && <div style={{ fontSize: '0.6rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.notes}</div>}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)', flexShrink: 0 }}>{s.date && formatAWST(new Date(s.date), 'dd MMM')}</div>
                  </div>
                )
              })}
              {studySessions.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: '0.78rem' }}>No sessions logged yet</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
