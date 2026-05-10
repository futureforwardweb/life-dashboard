import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Check, Play, Pause, RotateCcw, Flame, Timer } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'
import { dateAWST, relativeDay } from '../lib/time'
import { celebrateAt } from '../lib/celebrate'

const PRIORITY_COLORS = { urgent: 'var(--rose)', high: 'var(--clay)', medium: 'var(--amber)', low: 'var(--sage)' }
const CATS = ['Personal', 'School', 'Sport', 'Health', 'Finance', 'Other']

function PomodoroTimer() {
  const [mode, setMode] = useState('work')
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const total = mode === 'work' ? 25 * 60 : 5 * 60
  const remaining = minutes * 60 + seconds
  const progress = 1 - remaining / total
  const r = 56; const circ = 2 * Math.PI * r

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds(s => {
        if (s === 0) {
          setMinutes(m => {
            if (m === 0) {
              setRunning(false)
              if (mode === 'work') { setSessions(n => n + 1); setMode('break'); setMinutes(5) }
              else { setMode('work'); setMinutes(25) }
              return mode === 'work' ? 5 : 25
            }
            return m - 1
          })
          return 59
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, mode])

  function reset() { setRunning(false); setMinutes(mode === 'work' ? 25 : 5); setSeconds(0) }

  return (
    <div className="glass" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div style={{ fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>
        {mode === 'work' ? '🎯 Focus Time' : '☕ Break'}
      </div>

      <div style={{ position: 'relative', width: 148, height: 148 }}>
        <svg width={148} height={148}>
          <circle cx={74} cy={74} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={9} />
          <circle cx={74} cy={74} r={r} fill="none"
            stroke={mode === 'work' ? 'var(--dusk)' : 'var(--sage)'}
            strokeWidth={9} strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - progress)}
            transform="rotate(-90 74 74)"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)', filter: running ? `drop-shadow(0 0 8px ${mode === 'work' ? 'rgba(155,143,212,0.6)' : 'rgba(109,191,138,0.5)'})` : 'none' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '2rem', fontWeight: 500, color: 'var(--cream)', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          {sessions > 0 && (
            <div style={{ fontSize: '0.58rem', color: mode === 'work' ? 'var(--dusk)' : 'var(--sage)' }}>
              {sessions} {sessions === 1 ? 'session' : 'sessions'} done
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" onClick={() => setRunning(r => !r)} style={{ padding: '10px 28px', gap: 8 }}>
          {running ? <Pause size={15} /> : <Play size={15} />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button className="btn btn-ghost" onClick={reset} style={{ padding: '10px 14px' }}><RotateCcw size={15} /></button>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {['work', 'break'].map(m => (
          <button key={m} onClick={() => { setMode(m); setMinutes(m === 'work' ? 25 : 5); setSeconds(0); setRunning(false) }}
            style={{ fontSize: '0.65rem', padding: '5px 14px', borderRadius: 99, border: '1px solid', cursor: 'pointer',
              borderColor: mode === m ? 'var(--dusk)' : 'var(--border)',
              background: mode === m ? 'rgba(155,143,212,0.15)' : 'transparent',
              color: mode === m ? 'var(--dusk)' : 'var(--muted)' }}>
            {m === 'work' ? 'Focus 25m' : 'Break 5m'}
          </button>
        ))}
      </div>
    </div>
  )
}

function HabitTracker() {
  const { habits, habitLogs, addHabit, logHabit, deleteHabit } = useLocalStore()
  const { addToast } = useUIStore()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '✦', frequency: 'daily' })
  const today = dateAWST()

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  function submit() {
    if (!form.name) return
    addHabit(form)
    addToast('Habit added', 'success')
    setAdding(false); setForm({ name: '', icon: '✦', frequency: 'daily' })
  }

  return (
    <div className="glass" style={{ padding: 24 }}>
      <div className="section-header">
        <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Flame size={13} color="var(--clay)" /> Habits
        </span>
        <button className="btn btn-ghost" style={{ padding: '6px 12px' }} onClick={() => setAdding(v => !v)}>
          <Plus size={14} />
        </button>
      </div>

      {habits.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 30px)', gap: 5, marginBottom: 10, alignItems: 'center' }}>
          <div />
          {last7.map(d => (
            <div key={d} style={{ fontSize: '0.56rem', color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>
              {new Date(d + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'narrow' })}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {habits.map(h => {
          const streak = (() => {
            let s = 0
            for (let i = 0; i < 30; i++) {
              const d = new Date(); d.setDate(d.getDate() - i)
              const dk = d.toISOString().split('T')[0]
              if (habitLogs.some(l => l.habitId === h.id && l.date === dk)) s++
              else break
            }
            return s
          })()
          const todayDone = habitLogs.some(l => l.habitId === h.id && l.date === today)
          return (
            <motion.div key={h.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7, 30px)', gap: 5, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{h.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', color: todayDone ? 'var(--sage)' : 'var(--cream)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
                  {streak > 0 && <div style={{ fontSize: '0.58rem', color: 'var(--clay)' }}>{streak}d 🔥</div>}
                </div>
              </div>
              {last7.map(d => {
                const done = habitLogs.some(l => l.habitId === h.id && l.date === d)
                const isToday = d === today
                return (
                  <button key={d} onClick={() => { logHabit(h.id, d); if (!done) addToast(`${h.icon} logged`, 'success') }}
                    style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid', cursor: 'pointer',
                      borderColor: done ? 'var(--sage)' : isToday ? 'rgba(255,255,255,0.15)' : 'var(--border)',
                      background: done ? 'rgba(109,191,138,0.25)' : isToday ? 'rgba(255,255,255,0.04)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                    {done && <Check size={12} color="var(--sage)" />}
                  </button>
                )
              })}
            </motion.div>
          )
        })}
      </AnimatePresence>

      {habits.length === 0 && !adding && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0', fontSize: '0.78rem' }}>
          No habits yet — build something consistent.
        </div>
      )}

      {adding && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-sm" style={{ padding: 14, marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="input-base" placeholder="Emoji" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} style={{ width: 60 }} />
            <input className="input-base" placeholder="Habit name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={submit} style={{ flex: 1 }}>Add</button>
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function Tasks() {
  const { tasks, addTask, updateTask, deleteTask, toggleTaskComplete, goals } = useLocalStore()
  const { addToast } = useUIStore()
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ title: '', priority: 'medium', category: 'Personal', dueDate: '', notes: '', goalId: '' })
  const today = dateAWST()

  const filtered = tasks.filter(t => {
    if (filter === 'today') return t.dueDate === today && !t.completed
    if (filter === 'pending') return !t.completed
    if (filter === 'done') return t.completed
    return true
  })

  const counts = {
    all: tasks.length,
    today: tasks.filter(t => t.dueDate === today && !t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    done: tasks.filter(t => t.completed).length,
  }

  function submit() {
    if (!form.title) return
    addTask(form)
    addToast('Task added', 'success')
    setAdding(false)
    setForm({ title: '', priority: 'medium', category: 'Personal', dueDate: '', notes: '', goalId: '' })
  }

  function toggle(t, e) {
    const wasComplete = t.completed
    toggleTaskComplete(t.id)
    if (!wasComplete) celebrateAt(e, { variant: 'task', message: 'Done.' })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tasks <em style={{ fontStyle: 'italic', color: 'var(--sand)' }}>&amp; Habits</em></h1>
        <p className="page-subtitle">Daily tasks, focus timer &amp; habit tracking</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 20, alignItems: 'start' }}>
        {/* Task list */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: 24 }}>
          <div className="section-header" style={{ flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {['all', 'today', 'pending', 'done'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  fontSize: '0.6rem', padding: '4px 11px', borderRadius: 99, border: '1px solid',
                  textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                  borderColor: filter === f ? 'var(--dusk)' : 'var(--border)',
                  background: filter === f ? 'rgba(155,143,212,0.15)' : 'transparent',
                  color: filter === f ? 'var(--dusk)' : 'var(--muted)',
                }}>
                  {f} {counts[f] > 0 && <span style={{ opacity: 0.7 }}>({counts[f]})</span>}
                </button>
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
                <input className="input-base" placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ marginBottom: 8 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <select className="input-base" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {['urgent', 'high', 'medium', 'low'].map(p => <option key={p}>{p}</option>)}
                  </select>
                  <select className="input-base" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <input type="date" className="input-base" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                  <select className="input-base" value={form.goalId} onChange={e => setForm({ ...form, goalId: e.target.value })} title="Link to a goal — completion auto-bumps progress">
                    <option value="">No goal link</option>
                    {goals.map(g => <option key={g.id} value={g.id}>↗ {g.title}</option>)}
                  </select>
                </div>
                <textarea className="input-base" placeholder="Notes (optional)" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ marginBottom: 8, resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={submit} style={{ flex: 1 }}>Add Task</button>
                  <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {filtered.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: '0.82rem' }}>
                {filter === 'done' ? 'Nothing completed yet.' : filter === 'today' ? "Nothing due today — enjoy the day." : 'All clear. Add a task above.'}
              </motion.div>
            )}
            {filtered.map(t => {
              const overdue = t.dueDate && t.dueDate < today && !t.completed
              return (
                <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
                  {/* Priority bar */}
                  <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 99, background: PRIORITY_COLORS[t.priority], flexShrink: 0, opacity: t.completed ? 0.3 : 1 }} />
                  <button onClick={(e) => toggle(t, e)} style={{
                    width: 20, height: 20, borderRadius: 6, border: `1.5px solid`,
                    borderColor: t.completed ? 'var(--sage)' : PRIORITY_COLORS[t.priority] || 'var(--border)',
                    background: t.completed ? 'rgba(109,191,138,0.25)' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s',
                  }}>
                    {t.completed && <Check size={10} color="var(--sage)" />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', color: t.completed ? 'var(--muted)' : 'var(--cream)', fontWeight: 500, textDecoration: t.completed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.58rem', padding: '2px 8px', borderRadius: 99,
                        background: `${PRIORITY_COLORS[t.priority]}18`, color: PRIORITY_COLORS[t.priority],
                        border: `1px solid ${PRIORITY_COLORS[t.priority]}30`, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {t.priority}
                      </span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{t.category}</span>
                      {t.dueDate && (
                        <span style={{ fontSize: '0.6rem', color: overdue ? 'var(--rose)' : 'var(--muted)' }}>
                          {overdue ? '⚠ ' : ''}{relativeDay(t.dueDate)}
                        </span>
                      )}
                    </div>
                    {t.notes && <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{t.notes}</div>}
                  </div>
                  <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.4, padding: 4, flexShrink: 0 }}>
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>

        {/* Right: Pomodoro + Habits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PomodoroTimer />
          <HabitTracker />
        </div>
      </div>
    </div>
  )
}
