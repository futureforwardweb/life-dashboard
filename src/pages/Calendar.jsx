import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, X, Clock, Calendar as CalIcon } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, startOfWeek, endOfWeek, addDays,
  isSameMonth, differenceInDays, parseISO,
} from 'date-fns'

const CAT_COLOR = {
  School:   'var(--dusk)',
  Sport:    'var(--clay)',
  Health:   'var(--sage)',
  Personal: 'var(--amber)',
  Social:   'var(--rose)',
  Other:    'var(--teal)',
}
const CATS = Object.keys(CAT_COLOR)
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const todayStr = () => format(new Date(), 'yyyy-MM-dd')

// ── Event pill ────────────────────────────────────────────────────────────────
function EventPill({ event, onDelete, compact = false }) {
  const c = event.color || 'var(--dusk)'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: compact ? 4 : 6,
      padding: compact ? '2px 6px' : '7px 10px',
      borderRadius: compact ? 5 : 8,
      background: `${c}18`,
      border: `1px solid ${c}28`,
      fontSize: compact ? '0.56rem' : '0.72rem',
      color: c, fontWeight: 600,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      {event.time && !compact && <Clock size={10} style={{ flexShrink: 0, opacity: 0.7 }} />}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{event.title}</span>
      {onDelete && (
        <button onClick={e => { e.stopPropagation(); onDelete() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: c, opacity: 0.6, padding: 0, flexShrink: 0, lineHeight: 1 }}>
          <X size={10} />
        </button>
      )}
    </div>
  )
}

// ── Day detail panel ──────────────────────────────────────────────────────────
function DayPanel({ selected, events, onDelete, onAdd }) {
  if (!selected) return null
  const dayEvents = events.filter(e => e.date === format(selected, 'yyyy-MM-dd'))
  const daysAway = differenceInDays(selected, new Date())

  return (
    <motion.div
      key={selected.toISOString()}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="glass" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Day header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.6rem', color: 'var(--cream)', lineHeight: 1, marginBottom: 4 }}>
            {format(selected, 'd')}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            {format(selected, 'EEEE')}<br />{format(selected, 'MMMM yyyy')}
          </div>
          {isToday(selected) ? (
            <span style={{ display: 'inline-block', marginTop: 6, fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(155,143,212,0.18)', color: 'var(--dusk)', padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(155,143,212,0.3)' }}>
              Today
            </span>
          ) : daysAway > 0 ? (
            <span style={{ display: 'inline-block', marginTop: 6, fontSize: '0.56rem', color: 'var(--muted)', padding: '2px 4px' }}>
              {daysAway} day{daysAway !== 1 ? 's' : ''} away
            </span>
          ) : null}
        </div>
        <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.68rem' }} onClick={onAdd}>
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Events for this day */}
      <div style={{ flex: 1 }}>
        {dayEvents.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '24px 0',
            color: 'var(--muted)', fontSize: '0.75rem',
          }}>
            {isToday(selected) ? 'Nothing today 🎉' : 'Nothing scheduled'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dayEvents.map(e => (
              <div key={e.id} style={{
                padding: '12px 14px', borderRadius: 12,
                background: `${e.color || 'var(--dusk)'}10`,
                border: `1px solid ${e.color || 'var(--dusk)'}22`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.84rem', color: 'var(--cream)', fontWeight: 600 }}>{e.title}</div>
                    {e.time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, fontSize: '0.62rem', color: e.color || 'var(--dusk)' }}>
                        <Clock size={10} /> {e.time}
                      </div>
                    )}
                    {e.notes && <div style={{ fontSize: '0.66rem', color: 'var(--muted)', marginTop: 5, lineHeight: 1.5 }}>{e.notes}</div>}
                  </div>
                  <button onClick={() => onDelete(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.5, padding: 2, flexShrink: 0 }}>
                    <X size={13} />
                  </button>
                </div>
                <span style={{
                  display: 'inline-block', marginTop: 8,
                  fontSize: '0.54rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 99,
                  background: `${e.color || 'var(--dusk)'}18`, color: e.color || 'var(--dusk)',
                  border: `1px solid ${e.color || 'var(--dusk)'}25`,
                }}>
                  {e.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Calendar() {
  const { events, addEvent, deleteEvent } = useLocalStore()
  const { addToast } = useUIStore()
  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState(new Date())
  const [view, setView] = useState('month')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', category: 'Personal', notes: '' })

  // ── Calendar grid ────────────────────────────────────────────────────────
  const monthStart = startOfMonth(current)
  const monthEnd   = endOfMonth(current)
  const calDays    = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) })
  const weekDays   = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(current), i))

  const dayEvs = (date) => events.filter(e => e.date === format(date, 'yyyy-MM-dd'))

  function navigate(dir) {
    const n = new Date(current)
    if (view === 'week') n.setDate(n.getDate() + dir * 7)
    else n.setMonth(n.getMonth() + dir)
    setCurrent(n)
  }

  function selectDay(day) {
    setSelected(day)
    setForm(f => ({ ...f, date: format(day, 'yyyy-MM-dd') }))
  }

  function submit() {
    if (!form.title || !form.date) return
    addEvent({ ...form, color: CAT_COLOR[form.category] || 'var(--dusk)' })
    addToast('Event added', 'success')
    setShowForm(false)
    setForm(f => ({ ...f, title: '', time: '', notes: '' }))
  }

  function handleDelete(id) {
    deleteEvent(id)
    addToast('Event removed', 'success')
  }

  // Upcoming grouped by date
  const today = todayStr()
  const upcoming = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const grouped = {}
  upcoming.forEach(e => {
    if (!grouped[e.date]) grouped[e.date] = []
    grouped[e.date].push(e)
  })

  const navLabel = view === 'week'
    ? `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`
    : format(current, 'MMMM yyyy')

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Calendar</h1>
            <p className="page-subtitle">Schedule, events &amp; reminders</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            <Plus size={15} /> Add Event
          </button>
        </div>
      </div>

      {/* ── Add form (collapsible) ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 20 }}
          >
            <div className="glass" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="section-title">New Event</span>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 130px', gap: 8, marginBottom: 8 }}>
                <input
                  className="input-base" placeholder="Event title…"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  autoFocus
                />
                <input type="date" className="input-base" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                <input type="time" className="input-base" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 8 }}>
                <select className="input-base" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
                <input className="input-base" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                <button className="btn btn-primary" onClick={submit}>Save</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

        {/* Calendar panel */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass" style={{ padding: 24 }}>
          {/* Nav bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)', borderRadius: 9, padding: '7px 11px', cursor: 'pointer', color: 'var(--cream)', transition: 'all 0.15s' }}>
                <ChevronLeft size={15} />
              </button>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.45rem', fontWeight: 400, color: 'var(--cream)', minWidth: 180, textAlign: 'center' }}>
                {navLabel}
              </div>
              <button onClick={() => navigate(1)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)', borderRadius: 9, padding: '7px 11px', cursor: 'pointer', color: 'var(--cream)', transition: 'all 0.15s' }}>
                <ChevronRight size={15} />
              </button>
              <button
                onClick={() => { setCurrent(new Date()); setSelected(new Date()) }}
                style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 99, border: '1px solid rgba(155,143,212,0.35)', background: 'rgba(155,143,212,0.1)', color: 'var(--dusk)', cursor: 'pointer' }}
              >
                Today
              </button>
            </div>

            {/* View switcher */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 11, padding: '3px', gap: 2 }}>
              {['month','week','agenda'].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  fontSize: '0.6rem', padding: '5px 14px', borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  textTransform: 'capitalize', letterSpacing: '0.08em', fontWeight: 700,
                  background: view === v ? 'rgba(155,143,212,0.22)' : 'transparent',
                  color: view === v ? 'var(--dusk)' : 'var(--muted)',
                  transition: 'all 0.2s',
                }}>{v}</button>
              ))}
            </div>
          </div>

          {/* ── Month view ── */}
          {view === 'month' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
                {DOW.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.56rem', color: 'var(--muted2)', fontWeight: 700, padding: '4px 0', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
                {calDays.map(day => {
                  const evs = dayEvs(day)
                  const isSel = isSameDay(day, selected)
                  const tod = isToday(day)
                  const inMon = isSameMonth(day, current)
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => selectDay(day)}
                      style={{
                        minHeight: 76, borderRadius: 10, cursor: 'pointer',
                        padding: '7px 7px 5px',
                        background: isSel
                          ? 'rgba(155,143,212,0.2)'
                          : tod ? 'rgba(155,143,212,0.1)'
                          : inMon ? 'rgba(255,255,255,0.02)' : 'transparent',
                        border: `1px solid ${isSel ? 'rgba(155,143,212,0.5)' : tod ? 'rgba(155,143,212,0.25)' : 'rgba(255,255,255,0.05)'}`,
                        opacity: inMon ? 1 : 0.28,
                        transition: 'all 0.15s',
                        boxShadow: isSel ? '0 0 20px rgba(155,143,212,0.15)' : 'none',
                      }}
                    >
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: tod ? 700 : 400,
                        color: tod ? 'var(--dusk)' : inMon ? 'var(--cream)' : 'var(--muted)',
                        marginBottom: 4,
                        lineHeight: 1,
                      }}>
                        {tod ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: 'var(--dusk)', color: '#fff', fontSize: '0.7rem', boxShadow: '0 0 12px rgba(155,143,212,0.5)' }}>
                            {format(day, 'd')}
                          </span>
                        ) : format(day, 'd')}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {evs.slice(0, 2).map(e => (
                          <div key={e.id} style={{
                            fontSize: '0.54rem', padding: '1px 5px', borderRadius: 4,
                            background: `${e.color || 'var(--dusk)'}22`,
                            color: e.color || 'var(--dusk)',
                            fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            border: `1px solid ${e.color || 'var(--dusk)'}20`,
                          }}>
                            {e.title}
                          </div>
                        ))}
                        {evs.length > 2 && (
                          <div style={{ fontSize: '0.5rem', color: 'var(--muted)', paddingLeft: 4 }}>+{evs.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ── Week view ── */}
          {view === 'week' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
              {weekDays.map(day => {
                const evs = dayEvs(day)
                const isSel = isSameDay(day, selected)
                const tod = isToday(day)
                return (
                  <div key={day.toISOString()} onClick={() => selectDay(day)} style={{ cursor: 'pointer' }}>
                    <div style={{
                      textAlign: 'center', padding: '12px 6px 14px',
                      borderRadius: 12, marginBottom: 8,
                      background: isSel ? 'rgba(155,143,212,0.2)' : tod ? 'rgba(155,143,212,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? 'rgba(155,143,212,0.45)' : tod ? 'rgba(155,143,212,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: isSel ? '0 0 20px rgba(155,143,212,0.15)' : 'none',
                      transition: 'all 0.15s',
                    }}>
                      <div style={{ fontSize: '0.56rem', color: tod ? 'var(--dusk)' : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>
                        {format(day, 'EEE')}
                      </div>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: tod ? 'var(--dusk)' : 'var(--cream)', lineHeight: 1 }}>
                        {format(day, 'd')}
                      </div>
                      {evs.length > 0 && (
                        <div style={{ fontSize: '0.52rem', color: 'var(--muted)', marginTop: 5 }}>
                          {evs.length} event{evs.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {evs.map(e => (
                        <div key={e.id} style={{
                          padding: '5px 7px', borderRadius: 7,
                          background: `${e.color || 'var(--dusk)'}18`,
                          border: `1px solid ${e.color || 'var(--dusk)'}25`,
                          fontSize: '0.58rem', color: e.color || 'var(--dusk)', fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {e.time && <span style={{ opacity: 0.7 }}>{e.time} </span>}{e.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Agenda view ── */}
          {view === 'agenda' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.keys(grouped).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: '0.82rem' }}>
                  <CalIcon size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                  <div>Calendar is clear — add something!</div>
                </div>
              ) : Object.entries(grouped).slice(0, 30).map(([date, evs]) => {
                const d = parseISO(date)
                const daysAway = differenceInDays(d, new Date())
                return (
                  <div key={date}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: isToday(d) ? 'var(--dusk)' : 'var(--cream)', lineHeight: 1, minWidth: 30 }}>
                        {format(d, 'd')}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>
                          {format(d, 'EEE, MMM yyyy')}
                        </div>
                        {isToday(d) && (
                          <span style={{ fontSize: '0.52rem', background: 'rgba(155,143,212,0.18)', color: 'var(--dusk)', padding: '1px 7px', borderRadius: 99, fontWeight: 700, border: '1px solid rgba(155,143,212,0.3)' }}>
                            TODAY
                          </span>
                        )}
                        {!isToday(d) && daysAway > 0 && (
                          <span style={{ fontSize: '0.52rem', color: 'var(--muted)' }}>in {daysAway}d</span>
                        )}
                      </div>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 40 }}>
                      {evs.map(e => (
                        <div key={e.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', borderRadius: 10,
                          background: `${e.color || 'var(--dusk)'}0e`,
                          border: `1px solid ${e.color || 'var(--dusk)'}22`,
                        }}>
                          <div style={{ width: 3, height: 32, borderRadius: 99, background: e.color || 'var(--dusk)', flexShrink: 0 }} />
                          {e.time && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: e.color || 'var(--dusk)', flexShrink: 0, minWidth: 48 }}>
                              <Clock size={11} />{e.time}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.84rem', color: 'var(--cream)', fontWeight: 500 }}>{e.title}</div>
                            {e.notes && <div style={{ fontSize: '0.62rem', color: 'var(--muted)', marginTop: 2 }}>{e.notes}</div>}
                          </div>
                          <span style={{ fontSize: '0.54rem', padding: '2px 8px', borderRadius: 99, background: `${e.color || 'var(--dusk)'}18`, color: e.color || 'var(--dusk)', border: `1px solid ${e.color || 'var(--dusk)'}28`, fontWeight: 700, flexShrink: 0 }}>
                            {e.category}
                          </span>
                          <button onClick={() => handleDelete(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.5, flexShrink: 0 }}>
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Selected day panel */}
          <DayPanel
            selected={selected}
            events={events}
            onDelete={handleDelete}
            onAdd={() => { setShowForm(true); setForm(f => ({ ...f, date: format(selected, 'yyyy-MM-dd') })) }}
          />

          {/* Upcoming mini list */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass" style={{ padding: 20, flex: 1 }}>
            <div className="section-header" style={{ marginBottom: 12 }}>
              <span className="section-title">Next Up</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 99 }}>
                {upcoming.length}
              </span>
            </div>
            {upcoming.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: '0.75rem' }}>
                All clear!
              </div>
            ) : upcoming.slice(0, 10).map((e, i) => {
              const dAway = differenceInDays(parseISO(e.date), new Date())
              return (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                  borderBottom: i < Math.min(upcoming.length, 10) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 99, background: e.color || 'var(--dusk)', flexShrink: 0, minHeight: 32 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--cream)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                    <div style={{ fontSize: '0.58rem', color: 'var(--muted)', marginTop: 2 }}>
                      {format(parseISO(e.date), 'EEE dd MMM')}{e.time ? ` · ${e.time}` : ''}
                    </div>
                  </div>
                  {dAway === 0 ? (
                    <span style={{ fontSize: '0.52rem', color: 'var(--dusk)', fontWeight: 700 }}>Today</span>
                  ) : dAway > 0 ? (
                    <span style={{ fontSize: '0.52rem', color: 'var(--muted)' }}>+{dAway}d</span>
                  ) : null}
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
