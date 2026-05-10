import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  CheckSquare, TrendingUp, Flame, DollarSign, AlertTriangle, Calendar as CalIcon,
  Sparkles, Plus, X, Maximize2, Settings2, RotateCcw, GripVertical,
  Target, BookOpen, Heart, FileText, Quote, Activity, Zap, Check, ChevronRight,
} from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'
import { getDayGreeting, formatAWST, dateAWST } from '../lib/time'
import { celebrate, celebrateAt } from '../lib/celebrate'
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts'

// ── Mini Ring ─────────────────────────────────────────────────────────────────
function MiniRing({ value, max, color = 'var(--cream)', label, size = 76, stroke = 6 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 8px ${color}55)` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: 'var(--cream)', lineHeight: 1, fontWeight: 400 }}>
            {value}<span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>/{max}</span>
          </div>
        </div>
      </div>
      <div style={{ fontSize: '0.55rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</div>
    </div>
  )
}

// ── Widget shell ──────────────────────────────────────────────────────────────
function WidgetShell({ widget, editing, onRemove, onCycleSize, children }) {
  const dragControls = useDragControls()
  return (
    <Reorder.Item
      value={widget}
      dragListener={false}
      dragControls={dragControls}
      style={{ gridColumn: `span ${widget.span}`, listStyle: 'none' }}
      whileDrag={{ scale: 1.02, zIndex: 10, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`glass${editing ? ' editing edit-mode' : ''}`}
        style={{ padding: 0, position: 'relative', minHeight: 80 }}
      >
        {editing && (
          <div className="widget-controls" style={{ opacity: 1 }}>
            <button
              className="widget-control-btn"
              onPointerDown={e => dragControls.start(e)}
              title="Drag to reorder"
              style={{ cursor: 'grab' }}
            >
              <GripVertical size={11} />
            </button>
            <button className="widget-control-btn" onClick={onCycleSize} title={`Resize (${widget.span}/12)`}>
              <Maximize2 size={11} />
            </button>
            <button className="widget-control-btn" onClick={onRemove} title="Remove" style={{ background: 'rgba(232,132,152,0.15)', borderColor: 'rgba(232,132,152,0.3)' }}>
              <X size={12} color="var(--danger)" />
            </button>
          </div>
        )}
        <div style={{ padding: 24, position: 'relative', zIndex: 2 }}>
          {children}
        </div>
      </motion.div>
    </Reorder.Item>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WIDGET COMPONENTS — interactive
// ─────────────────────────────────────────────────────────────────────────────

function TodayWidget({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 36, alignItems: 'center', padding: '12px 16px' }}>
      <div>
        <div style={{ fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.26em', fontWeight: 700, marginBottom: 14 }}>
          Today
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
          <motion.div
            key={data.winsToday}
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="holographic"
            style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(3.5rem, 6vw, 5.5rem)', fontWeight: 300, lineHeight: 0.9 }}
          >
            {data.winsToday}
          </motion.div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: 'var(--muted)', fontStyle: 'italic' }}>wins</div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 700 }}>productivity</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: 'var(--cream)' }}>{data.productivityPct}%</div>
          </div>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.6, maxWidth: 540 }}>
          {data.winsToday === 0
            ? 'A blank slate. Start with one small thing — momentum follows.'
            : data.winsToday < 3
            ? `Good start — ${data.completedTasks} task${data.completedTasks === 1 ? '' : 's'} ticked, ${data.habitsDone} habit${data.habitsDone === 1 ? '' : 's'} kept.`
            : data.winsToday < 6
            ? `Strong rhythm. ${data.completedTasks} done, ${data.habitsDone}/${data.totalHabits} habits.`
            : `Exceptional day — ${data.winsToday} wins logged so far.`}
        </div>
        {data.overdueCount > 0 && (
          <div style={{
            marginTop: 16,
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 13px',
            borderRadius: 99, background: 'rgba(232,132,152,0.10)',
            border: '1px solid rgba(232,132,152,0.22)',
            fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 600,
          }}>
            <AlertTriangle size={11} /> {data.overdueCount} overdue
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        <MiniRing value={data.completedTasks} max={data.taskTotal} color="rgba(255,255,255,0.9)" label="Tasks" />
        <MiniRing value={data.habitsDone} max={data.totalHabits || 1} color="var(--accent)" label="Habits" />
        <MiniRing value={data.assignDone} max={data.assignTotal || 1} color="var(--accent-warm)" label="Assign." />
      </div>
    </div>
  )
}

function StatsWidget({ data, navigate }) {
  const items = [
    { label: 'Tasks Due', value: data.todayTasksCount, sub: `${data.allPendingCount} pending`, icon: CheckSquare, route: '/tasks' },
    { label: 'Est. ATAR', value: data.atar ?? '—', sub: `${data.subjectsCount} subjects`, icon: TrendingUp, route: '/academics' },
    { label: 'Habits', value: data.totalHabits ? `${Math.round((data.habitsDone / data.totalHabits) * 100)}%` : '—', sub: `${data.habitsDone}/${data.totalHabits} kept`, icon: Flame, route: '/tasks' },
    { label: 'Net', value: `${data.netSavings >= 0 ? '+' : '−'}$${Math.abs(data.netSavings).toFixed(0)}`, sub: data.netSavings >= 0 ? 'Ahead' : 'Over', icon: DollarSign, route: '/finance' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
      {items.map((it, i) => {
        const Icon = it.icon
        return (
          <button
            key={i}
            onClick={() => navigate(it.route)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              paddingRight: i < 3 ? 20 : 0,
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 700 }}>
                {it.label}
              </div>
              <Icon size={12} color="var(--muted2)" />
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.4rem', fontWeight: 300, color: 'var(--cream)', lineHeight: 1 }}>
              {it.value}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--muted)', marginTop: 6 }}>{it.sub}</div>
          </button>
        )
      })}
    </div>
  )
}

function UpcomingWidget({ data, navigate }) {
  return (
    <>
      <div className="section-header">
        <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <CalIcon size={11} /> Upcoming
        </span>
        <button onClick={() => navigate('/calendar')} style={{ fontSize: '0.58rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {data.upcoming.length} <ChevronRight size={9} />
        </button>
      </div>
      {data.upcoming.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: '0.78rem' }}>
          Nothing on the horizon.
        </div>
      ) : (
        <div>
          {data.upcoming.slice(0, 4).map((e, i, arr) => {
            const days = data.daysFromToday(e.date)
            const dayLabel = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days}d`
            return (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ width: 42, textAlign: 'center', flexShrink: 0, paddingRight: 12, borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: 'var(--cream)', lineHeight: 1 }}>
                    {formatAWST(new Date(e.date), 'dd')}
                  </div>
                  <div style={{ fontSize: '0.52rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 2 }}>
                    {formatAWST(new Date(e.date), 'MMM')}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--cream)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 2 }}>
                    {formatAWST(new Date(e.date), 'EEE')}{e.time ? ` · ${e.time}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: '0.55rem', color: 'var(--muted)', padding: '3px 9px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, flexShrink: 0 }}>
                  {dayLabel}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function PriorityWidget({ data, navigate }) {
  const { toggleTaskComplete } = useLocalStore()
  return (
    <>
      <div className="section-header">
        <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <CheckSquare size={11} /> Priority
        </span>
        <button onClick={() => navigate('/tasks')} style={{ fontSize: '0.58rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {data.allPending.length} open <ChevronRight size={9} />
        </button>
      </div>
      {data.allPending.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: '0.78rem' }}>
          Inbox zero.
        </div>
      ) : (
        <div>
          {data.allPending.slice(0, 5).map((t, i, arr) => {
            const isOverdue = t.dueDate && t.dueDate < data.today
            return (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <button
                  onClick={(e) => {
                    toggleTaskComplete(t.id)
                    celebrateAt(e, { variant: 'task', message: 'Done.' })
                  }}
                  style={{
                    width: 18, height: 18, borderRadius: 5,
                    border: '1.5px solid rgba(255,255,255,0.22)', background: 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cream)'; e.currentTarget.style.transform = 'scale(1.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.transform = 'scale(1)' }}
                  title="Complete task"
                >
                  <Check size={10} color="var(--cream)" style={{ opacity: 0 }} />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title}
                  </div>
                  {t.dueDate && (
                    <div style={{ fontSize: '0.58rem', color: isOverdue ? 'var(--danger)' : 'var(--muted)', marginTop: 2 }}>
                      {isOverdue ? '⚠ ' : ''}{formatAWST(new Date(t.dueDate), 'dd MMM')}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.52rem', color: 'var(--muted)', padding: '3px 9px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, flexShrink: 0 }}>
                  {t.priority}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function HabitsWidget({ data }) {
  const { logHabit } = useLocalStore()
  const today = data.today
  return (
    <>
      <div className="section-header">
        <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Flame size={11} /> Habits Today
        </span>
        <span style={{ fontSize: '0.58rem', color: 'var(--muted)' }}>{data.habitsDone}/{data.totalHabits}</span>
      </div>
      {data.totalHabits === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0', fontSize: '0.74rem' }}>
          Add habits to track.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {data.todayHabits.map(h => (
            <button
              key={h.id}
              onClick={(e) => {
                logHabit(h.id, today)
                if (!h.done) celebrateAt(e, { variant: 'habit', message: h.name })
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 11px', borderRadius: 99,
                background: h.done ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${h.done ? 'rgba(255,255,255,0.22)' : 'var(--border)'}`,
                fontSize: '0.7rem', color: h.done ? 'var(--cream)' : 'var(--muted)',
                fontWeight: 500, transition: 'all 0.2s', cursor: 'pointer',
              }}
            >
              <span>{h.icon || '✦'}</span>
              <span>{h.name}</span>
              {h.done && <span style={{ fontSize: '0.6rem' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

function MoodWidget({ data, navigate }) {
  return (
    <>
      <div className="section-header">
        <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Heart size={11} /> Mood · 7d
        </span>
        <button onClick={() => navigate('/health')} style={{ fontSize: '0.62rem', color: 'var(--cream)', fontFamily: 'JetBrains Mono, monospace', background: 'none', border: 'none', cursor: 'pointer' }}>
          {data.moodData.length > 0 ? (data.moodData.reduce((s, m) => s + m.Mood, 0) / data.moodData.length).toFixed(1) : '—'}
        </button>
      </div>
      {data.moodData.length > 1 ? (
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={data.moodData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="mWidget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgba(255,255,255,0.85)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="rgba(255,255,255,0.85)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="Mood" stroke="var(--cream)" strokeWidth={2} fill="url(#mWidget)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.7rem' }}>
          No mood logs yet
        </div>
      )}
    </>
  )
}

function FinanceWidget({ data, navigate }) {
  return (
    <>
      <div className="section-header">
        <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <DollarSign size={11} /> Finance · 6mo
        </span>
        <button onClick={() => navigate('/finance')} style={{ fontSize: '0.62rem', color: 'var(--cream)', fontFamily: 'JetBrains Mono, monospace', background: 'none', border: 'none', cursor: 'pointer' }}>
          ${data.monthIncome.toFixed(0)} <span style={{ color: 'var(--muted2)' }}>·</span> ${data.monthExpense.toFixed(0)}
        </button>
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={data.financeMonths} barSize={6} barGap={2} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="m" tick={{ fill: 'rgba(242,237,228,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
          <Bar dataKey="Income" fill="rgba(255,255,255,0.85)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Spent" fill="rgba(232,160,126,0.7)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}

function GoalsWidget({ data, navigate }) {
  const top = data.goals.slice(0, 3)
  return (
    <>
      <div className="section-header">
        <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Target size={11} /> Goals
        </span>
        <button onClick={() => navigate('/goals')} style={{ fontSize: '0.58rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {data.goals.length} active <ChevronRight size={9} />
        </button>
      </div>
      {top.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0', fontSize: '0.74rem' }}>
          Set a goal to start.
        </div>
      ) : top.map((g, i) => (
        <div key={g.id} style={{ marginBottom: i < top.length - 1 ? 14 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--cream)', fontWeight: 500 }}>{g.title}</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>{g.progress || 0}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${g.progress || 0}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0.7), rgba(184,174,240,0.8))' }} />
          </div>
        </div>
      ))}
    </>
  )
}

function NotesWidget({ data, navigate }) {
  const recent = data.notes.slice(0, 3)
  return (
    <>
      <div className="section-header">
        <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <FileText size={11} /> Recent Notes
        </span>
        <button onClick={() => navigate('/notes')} style={{ fontSize: '0.58rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {data.notes.length} <ChevronRight size={9} />
        </button>
      </div>
      {recent.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0', fontSize: '0.74rem' }}>
          No notes yet.
        </div>
      ) : recent.map((n, i) => (
        <div key={n.id} style={{ padding: '10px 0', borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--cream)', fontWeight: 500, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {n.title || 'Untitled'}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {(n.content || '').slice(0, 60)}
          </div>
        </div>
      ))}
    </>
  )
}

const QUOTES = [
  { t: 'The way to get started is to quit talking and begin doing.', a: 'Walt Disney' },
  { t: 'Discipline equals freedom.', a: 'Jocko Willink' },
  { t: 'You will never always be motivated. You must learn to be disciplined.', a: '—' },
  { t: 'Small steps in the right direction can turn out to be the biggest step of your life.', a: '—' },
  { t: 'The unexamined life is not worth living.', a: 'Socrates' },
  { t: 'What you do every day matters more than what you do once in a while.', a: 'Gretchen Rubin' },
]

function QuoteWidget() {
  const i = new Date().getDate() % QUOTES.length
  const q = QUOTES[i]
  return (
    <>
      <div className="section-header">
        <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Quote size={11} /> Daily Quote
        </span>
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--cream)', fontStyle: 'italic', lineHeight: 1.4, marginBottom: 12 }}>
        "{q.t}"
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>— {q.a}</div>
    </>
  )
}

function HealthWidget({ data, navigate }) {
  const todayLog = data.sleepLogs[0]
  const todayWater = data.waterLogs.filter(w => w.date === data.today).reduce((s, w) => s + (parseFloat(w.amount) || 0), 0)
  return (
    <>
      <div className="section-header">
        <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Activity size={11} /> Health
        </span>
        <button onClick={() => navigate('/health')} style={{ fontSize: '0.58rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <ChevronRight size={11} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 4 }}>Sleep</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: 'var(--cream)' }}>
            {todayLog?.hours ?? '—'}<span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>h</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 4 }}>Water</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: 'var(--cream)' }}>
            {todayWater}<span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>ml</span>
          </div>
        </div>
      </div>
    </>
  )
}

function StreakWidget({ data }) {
  const streak = (() => {
    let max = 0
    data.habits.forEach(h => {
      let count = 0
      const d = new Date()
      while (true) {
        const ds = d.toISOString().slice(0,10)
        if (data.habitLogs.some(l => l.habitId === h.id && l.date === ds)) {
          count++
          d.setDate(d.getDate() - 1)
        } else break
      }
      if (count > max) max = count
    })
    return max
  })()
  return (
    <>
      <div className="section-header">
        <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Zap size={11} /> Best Streak
        </span>
      </div>
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div className="holographic" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3.5rem', fontWeight: 300, lineHeight: 1 }}>
          {streak}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 6 }}>days</div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
const WIDGETS = {
  today:    { name: 'Today',          component: TodayWidget,    defaultSpan: 12, icon: Sparkles },
  stats:    { name: 'Quick Stats',    component: StatsWidget,    defaultSpan: 12, icon: Activity },
  upcoming: { name: 'Upcoming',       component: UpcomingWidget, defaultSpan: 6,  icon: CalIcon },
  priority: { name: 'Priority Tasks', component: PriorityWidget, defaultSpan: 6,  icon: CheckSquare },
  habits:   { name: 'Habits',         component: HabitsWidget,   defaultSpan: 4,  icon: Flame },
  mood:     { name: 'Mood Chart',     component: MoodWidget,     defaultSpan: 4,  icon: Heart },
  finance:  { name: 'Finance Chart',  component: FinanceWidget,  defaultSpan: 4,  icon: DollarSign },
  goals:    { name: 'Goals',          component: GoalsWidget,    defaultSpan: 6,  icon: Target },
  notes:    { name: 'Recent Notes',   component: NotesWidget,    defaultSpan: 6,  icon: FileText },
  quote:    { name: 'Daily Quote',    component: QuoteWidget,    defaultSpan: 6,  icon: Quote },
  health:   { name: 'Health Today',   component: HealthWidget,   defaultSpan: 4,  icon: Activity },
  streak:   { name: 'Best Streak',    component: StreakWidget,   defaultSpan: 4,  icon: Zap },
}

const SPAN_CYCLE = [3, 4, 6, 8, 12]

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function Overview() {
  const store = useLocalStore()
  const navigate = useNavigate()
  const {
    dashboardLayout, dashboardEditing, setDashboardEditing,
    addDashboardWidget, removeDashboardWidget, updateDashboardWidget,
    setDashboardLayout, resetDashboard, addToast,
  } = useUIStore()

  const [now, setNow] = useState(new Date())
  const [showPicker, setShowPicker] = useState(false)
  const today = dateAWST()

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const data = useMemo(() => {
    const todayTasks = store.tasks.filter(t => !t.completed && t.dueDate === today)
    const completedToday = store.tasks.filter(t => t.completed && t.completedAt?.startsWith(today))
    const allPending = store.tasks.filter(t => !t.completed)
    const pendingAssignments = store.assignments.filter(a => a.status === 'pending')
    const overdueAssignments = store.assignments.filter(a => a.status === 'pending' && a.dueDate < today)

    const todayHabits = store.habits.map(h => ({
      ...h,
      done: store.habitLogs.some(l => l.habitId === h.id && l.date === today),
    }))
    const habitsDone = todayHabits.filter(h => h.done).length

    const thisMonth = new Date().toISOString().slice(0, 7)
    const monthIncome = store.transactions.filter(t => t.type === 'income' && t.date?.startsWith(thisMonth)).reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const monthExpense = store.transactions.filter(t => t.type === 'expense' && t.date?.startsWith(thisMonth)).reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const netSavings = monthIncome - monthExpense

    const moodData = [...store.moodLogs].slice(0, 7).reverse().map(m => ({
      date: formatAWST(new Date(m.date || m.createdAt), 'dd'),
      Mood: m.mood,
    }))

    const upcoming = [...store.events]
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))

    const atar = (() => {
      const scores = store.subjects.map(s => parseFloat(s.scaledScore || s.rawScore || 0)).filter(Boolean)
      if (!scores.length) return null
      scores.sort((a, b) => b - a)
      const avg = scores.slice(0, 4).reduce((s, v) => s + v, 0) / Math.min(scores.length, 4)
      return Math.min(99.95, Math.max(0, (avg - 50) * 1.8 + 60)).toFixed(2)
    })()

    const financeMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - 5 + i)
      const key = d.toISOString().slice(0, 7)
      return {
        m: d.toLocaleDateString('en-AU', { month: 'short' }),
        Income: store.transactions.filter(t => t.type === 'income' && t.date?.startsWith(key)).reduce((s, t) => s + parseFloat(t.amount || 0), 0),
        Spent: store.transactions.filter(t => t.type === 'expense' && t.date?.startsWith(key)).reduce((s, t) => s + parseFloat(t.amount || 0), 0),
      }
    })

    const winsToday = completedToday.length + habitsDone
    const productivityPct = (() => {
      const total = todayTasks.length + completedToday.length + Math.max(store.habits.length, 1)
      const done = completedToday.length + habitsDone
      return total > 0 ? Math.round((done / total) * 100) : 0
    })()

    const monthAssignments = store.assignments.filter(a => a.dueDate?.startsWith(thisMonth))
    const monthAssignDone = monthAssignments.filter(a => a.status !== 'pending').length

    function daysFromToday(dateStr) {
      const d = new Date(dateStr); d.setHours(0,0,0,0)
      const t = new Date(); t.setHours(0,0,0,0)
      return Math.round((d - t) / (1000 * 60 * 60 * 24))
    }

    return {
      today, todayTasks, completedToday, allPending,
      pendingAssignments, overdueAssignments,
      todayHabits, habitsDone, totalHabits: store.habits.length,
      monthIncome, monthExpense, netSavings,
      moodData, upcoming, atar, financeMonths,
      winsToday, productivityPct,
      completedTasks: completedToday.length,
      taskTotal: Math.max(todayTasks.length + completedToday.length, 1),
      assignDone: monthAssignDone,
      assignTotal: Math.max(monthAssignments.length, 1),
      todayTasksCount: todayTasks.length,
      allPendingCount: allPending.length,
      overdueCount: overdueAssignments.length,
      subjectsCount: store.subjects.length,
      goals: store.goals,
      notes: store.notes,
      sleepLogs: store.sleepLogs,
      waterLogs: store.waterLogs,
      habits: store.habits,
      habitLogs: store.habitLogs,
      daysFromToday,
    }
  }, [store, today])

  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const availableWidgets = Object.entries(WIDGETS).filter(([id]) => !dashboardLayout.find(w => w.id === id))

  function cycleSpan(id, currentSpan) {
    const nextIdx = (SPAN_CYCLE.indexOf(currentSpan) + 1) % SPAN_CYCLE.length
    updateDashboardWidget(id, { span: SPAN_CYCLE[nextIdx] })
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 36, paddingTop: 6 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.3em',
              textTransform: 'uppercase', fontWeight: 700, marginBottom: 14,
            }}>
              <span style={{ display: 'inline-block', width: 26, height: 1, background: 'linear-gradient(90deg, transparent, var(--muted2))' }} />
              {getDayGreeting()}
            </div>
            <h1
              className="holographic-subtle"
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(3rem, 6.5vw, 5.5rem)',
                fontWeight: 300, lineHeight: 0.95,
                margin: '0 0 14px', letterSpacing: '-0.015em',
              }}
            >
              {store.profile.name ? `${store.profile.name}'s` : 'Your'}{' '}
              <em style={{ fontStyle: 'italic' }}>World</em>
            </h1>
            <div style={{ fontSize: '0.76rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span>{formatAWST(new Date(), 'EEEE, dd MMMM yyyy')}</span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--muted2)' }} />
              <span>Perth, WA</span>
              {data.winsToday > 0 && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--muted2)' }} />
                  <motion.span
                    key={data.winsToday}
                    initial={{ scale: 1.3, color: 'var(--positive)' }}
                    animate={{ scale: 1, color: 'rgba(240,235,225,0.55)' }}
                    transition={{ duration: 0.6 }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <Sparkles size={11} /> {data.winsToday} win{data.winsToday !== 1 ? 's' : ''} today
                  </motion.span>
                </>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 'clamp(2.6rem, 5vw, 4.4rem)',
              fontWeight: 200, color: 'var(--cream)',
              lineHeight: 1, letterSpacing: '-0.04em',
            }}>
              {hh}<span style={{ color: 'var(--muted2)', animation: 'pulse 2s ease-in-out infinite', margin: '0 4px' }}>:</span>{mm}
            </div>
            <div style={{ fontSize: '0.54rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.26em', marginTop: 8 }}>
              AWST
            </div>
          </div>
        </div>
      </motion.div>

      {/* EDIT BAR */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}
      >
        {dashboardEditing && (
          <>
            <button className="btn btn-glass" onClick={() => setShowPicker(true)} style={{ padding: '8px 14px' }}>
              <Plus size={12} /> Add Widget
            </button>
            <button className="btn btn-glass" onClick={() => { resetDashboard(); addToast('Dashboard reset', 'success') }} style={{ padding: '8px 14px' }}>
              <RotateCcw size={12} /> Reset
            </button>
          </>
        )}
        <button
          className={dashboardEditing ? 'btn btn-primary' : 'btn btn-glass'}
          onClick={() => setDashboardEditing(!dashboardEditing)}
          style={{ padding: '8px 14px' }}
        >
          <Settings2 size={12} /> {dashboardEditing ? 'Done' : 'Customize'}
        </button>
      </motion.div>

      {/* WIDGET GRID — drag to reorder */}
      <Reorder.Group
        axis="y"
        values={dashboardLayout}
        onReorder={setDashboardLayout}
        as="div"
        className="grid-12"
        style={{ listStyle: 'none', padding: 0, margin: 0 }}
      >
        <AnimatePresence mode="popLayout">
          {dashboardLayout.map((widget) => {
            const reg = WIDGETS[widget.id]
            if (!reg) return null
            const Component = reg.component
            return (
              <WidgetShell
                key={widget.id}
                widget={widget}
                editing={dashboardEditing}
                onRemove={() => { removeDashboardWidget(widget.id); addToast(`${reg.name} removed`, 'success') }}
                onCycleSize={() => cycleSpan(widget.id, widget.span)}
              >
                <Component data={data} navigate={navigate} />
              </WidgetShell>
            )
          })}
        </AnimatePresence>
      </Reorder.Group>

      {dashboardLayout.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass" style={{ padding: 60, textAlign: 'center' }}>
          <Sparkles size={32} style={{ opacity: 0.3, marginBottom: 16 }} />
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: 'var(--cream)', marginBottom: 8 }}>Empty canvas</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 20 }}>Add widgets to build your perfect overview.</div>
          <button className="btn btn-primary" onClick={() => { setDashboardEditing(true); setShowPicker(true) }}>
            <Plus size={12} /> Add Widget
          </button>
        </motion.div>
      )}

      {/* WIDGET PICKER MODAL */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" onClick={() => setShowPicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="glass modal" onClick={e => e.stopPropagation()} style={{ padding: 32 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: 'var(--cream)', fontWeight: 400 }}>
                    Add a widget
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>{availableWidgets.length} available</div>
                </div>
                <button className="widget-control-btn" onClick={() => setShowPicker(false)}>
                  <X size={14} />
                </button>
              </div>

              {availableWidgets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: '0.8rem' }}>
                  All widgets already added.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {availableWidgets.map(([id, reg]) => {
                    const Icon = reg.icon
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          addDashboardWidget(id, reg.defaultSpan)
                          addToast(`${reg.name} added`, 'success')
                          setShowPicker(false)
                        }}
                        className="glass-sm glass-hover"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '14px 16px', cursor: 'pointer',
                          color: 'var(--cream)', textAlign: 'left',
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: 'rgba(255,255,255,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}>
                          <Icon size={15} color="var(--cream)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 500, marginBottom: 2 }}>{reg.name}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>span {reg.defaultSpan}/12</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
