import React, { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Clock, CheckSquare, Calendar as CalIcon, BookOpen, Flame, AlertTriangle,
  ChevronLeft, ChevronRight, Sun, Moon, Coffee, Plus,
} from 'lucide-react'
import { useLocalStore } from '../store'
import { dateAWST, formatAWST } from '../lib/time'
import { celebrate, celebrateAt } from '../lib/celebrate'

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6am – 11pm
const HOUR_HEIGHT = 80 // px per hour

// Determine which hour bucket an item belongs to
function parseHour(timeStr) {
  if (!timeStr) return null
  const [h] = timeStr.split(':').map(Number)
  return h
}

function getDayPart(hour) {
  if (hour < 12) return { label: 'Morning', icon: Sun }
  if (hour < 17) return { label: 'Afternoon', icon: Coffee }
  if (hour < 21) return { label: 'Evening', icon: Sun }
  return { label: 'Night', icon: Moon }
}

const TYPE_STYLES = {
  task:       { color: 'rgba(255,255,255,0.85)',  label: 'Task',       icon: CheckSquare,    bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)' },
  assignment: { color: 'var(--accent-warm)',      label: 'Assignment', icon: BookOpen,       bg: 'rgba(232,160,126,0.08)', border: 'rgba(232,160,126,0.22)' },
  event:      { color: 'var(--accent)',           label: 'Event',      icon: CalIcon,        bg: 'rgba(184,174,240,0.08)', border: 'rgba(184,174,240,0.22)' },
  habit:      { color: 'var(--positive)',         label: 'Habit',      icon: Flame,          bg: 'rgba(143,199,163,0.08)', border: 'rgba(143,199,163,0.22)' },
  overdue:    { color: 'var(--danger)',           label: 'Overdue',    icon: AlertTriangle,  bg: 'rgba(232,132,152,0.08)', border: 'rgba(232,132,152,0.25)' },
}

export default function Today() {
  const store = useLocalStore()
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())
  const [offset, setOffset] = useState(0) // 0 = today, -1 = yesterday, etc
  const containerRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  // Auto-scroll to current hour on mount
  useEffect(() => {
    if (offset !== 0 || !containerRef.current) return
    const hour = now.getHours()
    if (hour >= 6 && hour <= 23) {
      const scrollTop = (hour - 6) * HOUR_HEIGHT - 100
      containerRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' })
    }
  }, [offset])

  const targetDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d
  }, [offset])

  const targetDateStr = targetDate.toISOString().slice(0, 10)
  const isToday = offset === 0
  const isPast = offset < 0
  const isFuture = offset > 0

  // Build timeline items
  const timelineItems = useMemo(() => {
    const items = []

    // Tasks due on this date
    store.tasks.forEach(t => {
      if (t.dueDate !== targetDateStr) return
      const hour = parseHour(t.dueTime) ?? 9
      items.push({
        id: `task-${t.id}`, type: t.completed ? 'task' : (t.dueDate < dateAWST() && !t.completed ? 'overdue' : 'task'),
        hour, time: t.dueTime, title: t.title, sub: t.priority, ref: t, raw: t,
        completed: t.completed,
      })
    })

    // Assignments due on this date
    store.assignments.forEach(a => {
      if (a.dueDate !== targetDateStr) return
      const subject = store.subjects.find(s => s.id === a.subjectId)
      const hour = parseHour(a.dueTime) ?? 23
      items.push({
        id: `assignment-${a.id}`, type: a.status === 'pending' ? 'assignment' : 'assignment',
        hour, time: a.dueTime, title: a.title, sub: subject?.name || 'Assignment', ref: a, raw: a,
        completed: a.status !== 'pending',
      })
    })

    // Events on this date
    store.events.forEach(e => {
      if (e.date !== targetDateStr) return
      const hour = parseHour(e.time) ?? 12
      items.push({
        id: `event-${e.id}`, type: 'event',
        hour, time: e.time, title: e.title, sub: e.category || 'Event', ref: e, raw: e,
      })
    })

    // Habit prompts (only for today, suggested at 7am)
    if (isToday) {
      store.habits.forEach(h => {
        const done = store.habitLogs.some(l => l.habitId === h.id && l.date === targetDateStr)
        items.push({
          id: `habit-${h.id}`, type: 'habit',
          hour: parseHour(h.preferredTime) ?? 7,
          time: h.preferredTime, title: h.name, sub: 'Daily habit',
          ref: h, raw: h,
          completed: done, isHabit: true,
        })
      })
    }

    return items.sort((a, b) => {
      if (a.hour !== b.hour) return a.hour - b.hour
      const at = a.time || '00:00'
      const bt = b.time || '00:00'
      return at.localeCompare(bt)
    })
  }, [store, targetDateStr, isToday])

  // Current time line position
  const currentHour = now.getHours() + now.getMinutes() / 60
  const currentTimeY = isToday && currentHour >= 6 && currentHour <= 23
    ? (currentHour - 6) * HOUR_HEIGHT
    : null

  // Group items by hour
  const itemsByHour = useMemo(() => {
    const grouped = {}
    HOURS.forEach(h => grouped[h] = [])
    timelineItems.forEach(it => {
      const h = Math.max(6, Math.min(23, it.hour))
      grouped[h].push(it)
    })
    return grouped
  }, [timelineItems])

  const completedCount = timelineItems.filter(t => t.completed).length
  const totalCount = timelineItems.length

  function handleComplete(item, e) {
    if (item.id.startsWith('task-')) {
      store.toggleTaskComplete(item.raw.id)
      celebrateAt(e, { variant: 'task', message: 'Done.' })
    } else if (item.id.startsWith('habit-')) {
      store.logHabit(item.raw.id, targetDateStr)
      if (!item.completed) celebrateAt(e, { variant: 'habit', message: item.raw.name })
    } else if (item.id.startsWith('assignment-')) {
      store.updateAssignment(item.raw.id, { status: item.completed ? 'pending' : 'done' })
      if (!item.completed) celebrateAt(e, { variant: 'task', message: 'Submitted.' })
    }
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">{isToday ? 'Today' : isPast ? formatAWST(targetDate, 'EEEE') : formatAWST(targetDate, 'EEEE')}</h1>
            <p className="page-subtitle">
              {formatAWST(targetDate, 'dd MMMM yyyy')} · {totalCount} item{totalCount !== 1 ? 's' : ''}
              {totalCount > 0 && ` · ${completedCount} done`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setOffset(o => o - 1)} className="btn btn-glass" style={{ padding: 8 }} title="Previous day">
              <ChevronLeft size={14} />
            </button>
            {offset !== 0 && (
              <button onClick={() => setOffset(0)} className="btn btn-glass" style={{ padding: '8px 14px' }}>
                Today
              </button>
            )}
            <button onClick={() => setOffset(o => o + 1)} className="btn btn-glass" style={{ padding: 8 }} title="Next day">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Day-part summary strip */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Morning', range: [6, 12], icon: Sun },
          { label: 'Afternoon', range: [12, 17], icon: Coffee },
          { label: 'Evening', range: [17, 21], icon: Sun },
          { label: 'Night', range: [21, 24], icon: Moon },
        ].map(part => {
          const Icon = part.icon
          const items = timelineItems.filter(it => it.hour >= part.range[0] && it.hour < part.range[1])
          const done = items.filter(it => it.completed).length
          return (
            <motion.div
              key={part.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="glass" style={{ padding: 16 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} color="var(--muted)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700 }}>
                    {part.label}
                  </div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: 'var(--cream)', lineHeight: 1, marginTop: 2 }}>
                    {items.length === 0 ? '—' : `${done}/${items.length}`}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Timeline */}
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="glass"
        style={{
          padding: 0,
          maxHeight: 'calc(100vh - 280px)',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative', padding: '24px 0' }}>
          {/* Current time indicator */}
          {currentTimeY != null && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                position: 'absolute', left: 0, right: 0,
                top: currentTimeY + 24,
                height: 1,
                background: 'linear-gradient(90deg, var(--cream), transparent)',
                zIndex: 5,
                pointerEvents: 'none',
              }}
            >
              <div style={{
                position: 'absolute', left: 60, top: -4,
                width: 9, height: 9, borderRadius: '50%',
                background: 'var(--cream)',
                boxShadow: '0 0 14px rgba(255,255,255,0.7), 0 0 28px rgba(184,174,240,0.4)',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute', left: 76, top: -8,
                fontSize: '0.55rem', color: 'var(--cream)', fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.1em', fontWeight: 700,
                textShadow: '0 0 8px rgba(0,0,0,0.8)',
              }}>
                NOW · {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
              </div>
            </motion.div>
          )}

          {HOURS.map((hour, hourIdx) => {
            const items = itemsByHour[hour] || []
            const dayPart = getDayPart(hour)
            const PartIcon = dayPart.icon
            const isCurrentHour = isToday && now.getHours() === hour
            return (
              <div
                key={hour}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 1fr',
                  minHeight: HOUR_HEIGHT,
                  borderBottom: hourIdx === HOURS.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                  position: 'relative',
                }}
              >
                {/* Hour label */}
                <div style={{
                  padding: '14px 16px 8px 24px',
                  textAlign: 'right',
                  borderRight: '1px solid var(--border)',
                  position: 'sticky', left: 0,
                }}>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.78rem',
                    color: isCurrentHour ? 'var(--cream)' : 'var(--muted)',
                    fontWeight: isCurrentHour ? 600 : 400,
                  }}>
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {hour === 6 && (
                    <div style={{ fontSize: '0.5rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 2 }}>
                      Morning
                    </div>
                  )}
                  {hour === 12 && (
                    <div style={{ fontSize: '0.5rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 2 }}>
                      Afternoon
                    </div>
                  )}
                  {hour === 17 && (
                    <div style={{ fontSize: '0.5rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 2 }}>
                      Evening
                    </div>
                  )}
                  {hour === 21 && (
                    <div style={{ fontSize: '0.5rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 2 }}>
                      Night
                    </div>
                  )}
                </div>

                {/* Items */}
                <div style={{ padding: '10px 24px 10px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.length === 0 && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--muted2)', fontStyle: 'italic', alignSelf: 'flex-start', paddingTop: 6 }}>
                      —
                    </div>
                  )}
                  <AnimatePresence>
                    {items.map((it, i) => {
                      const sty = TYPE_STYLES[it.type]
                      const Icon = sty.icon
                      const interactive = it.id.startsWith('task-') || it.id.startsWith('habit-') || it.id.startsWith('assignment-')
                      return (
                        <motion.div
                          key={it.id}
                          layout
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: it.completed ? 0.55 : 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ delay: i * 0.04 }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: sty.bg,
                            border: `1px solid ${sty.border}`,
                            cursor: interactive ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                          }}
                          onClick={interactive ? (e) => handleComplete(it, e) : undefined}
                          whileHover={interactive ? { x: 2 } : {}}
                        >
                          {interactive && (
                            <div style={{
                              width: 16, height: 16, borderRadius: 4,
                              border: `1.5px solid ${it.completed ? sty.color : sty.border}`,
                              background: it.completed ? sty.color : 'transparent',
                              flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s',
                            }}>
                              {it.completed && <CheckSquare size={9} color="#0a0a14" />}
                            </div>
                          )}
                          <Icon size={12} color={sty.color} style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '0.82rem', color: 'var(--cream)', fontWeight: 500,
                              textDecoration: it.completed ? 'line-through' : 'none',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {it.title}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 1 }}>
                              {it.time && <span style={{ marginRight: 8, fontFamily: 'JetBrains Mono, monospace' }}>{it.time}</span>}
                              <span>{it.sub}</span>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.5rem', color: sty.color,
                            padding: '2px 7px', borderRadius: 99, background: 'rgba(0,0,0,0.3)',
                            border: `1px solid ${sty.border}`,
                            textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {sty.label}
                          </span>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
