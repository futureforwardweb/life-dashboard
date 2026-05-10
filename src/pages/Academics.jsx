import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, BookOpen, Calculator, ChevronDown, ChevronUp,
  Target, TrendingUp, Award, Layers, ArrowUp, ArrowDown, Minus,
} from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
  ReferenceLine, CartesianGrid, Area, AreaChart,
} from 'recharts'

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */

function calcWeightedAvg(components) {
  const filled = components.filter(c => c.score !== '' && c.maxScore && parseFloat(c.maxScore) > 0 && c.weight)
  if (!filled.length) return null
  const totalWeight = filled.reduce((s, c) => s + parseFloat(c.weight || 0), 0)
  if (!totalWeight) return null
  const weightedSum = filled.reduce((s, c) => {
    const pct = (parseFloat(c.score) / parseFloat(c.maxScore)) * 100
    return s + pct * parseFloat(c.weight)
  }, 0)
  return weightedSum / totalWeight
}

function pctScore(c) {
  if (c.score === '' || !c.maxScore || !parseFloat(c.maxScore)) return null
  return (parseFloat(c.score) / parseFloat(c.maxScore)) * 100
}

function estimateATAR(subjects, gradeComponents) {
  if (!subjects.length) return null
  const scores = subjects.map(s => {
    const comps = gradeComponents.filter(c => c.subjectId === s.id)
    const weighted = calcWeightedAvg(comps)
    return parseFloat(weighted ?? s.scaledScore ?? s.rawScore ?? 0)
  }).filter(Boolean)
  if (!scores.length) return null
  scores.sort((a, b) => b - a)
  const top4 = scores.slice(0, 4)
  const avg = top4.reduce((s, v) => s + v, 0) / top4.length
  return Math.min(99.95, Math.max(0, (avg - 50) * 1.8 + 60))
}

function getGradeLabel(score) {
  if (score == null || score === '') return '—'
  const n = parseFloat(score)
  if (n >= 90) return 'A+'
  if (n >= 80) return 'A'
  if (n >= 70) return 'B'
  if (n >= 60) return 'C'
  if (n >= 50) return 'D'
  return 'E'
}

/* Single-accent palette: teal when above target / streak alive, amber when at-risk, muted otherwise. */
function statusColor(score, target = 70) {
  if (score == null || score === '') return 'var(--muted)'
  const n = parseFloat(score)
  if (n >= target) return 'var(--teal)'
  if (n >= target - 10) return 'var(--cream)'
  return 'var(--amber)'
}

const COMP_TYPES = [
  { value: 'SAC',        label: 'SAC' },
  { value: 'Exam',       label: 'Exam' },
  { value: 'Assignment', label: 'Assignment' },
  { value: 'Test',       label: 'Test' },
  { value: 'Practical',  label: 'Practical' },
  { value: 'Other',      label: 'Other' },
]

/* ─────────────────────────────────────────────────────────────────────────────
   Trajectory chart — per assessment, with target line
───────────────────────────────────────────────────────────────────────────── */

function TrajectoryChart({ data, target = 80, height = 260, label = 'SCORE TRAJECTORY' }) {
  const allScores = data.map(d => d.score).filter(s => s != null)
  if (!allScores.length) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.78rem' }}>
        Add assessment scores to see your trajectory
      </div>
    )
  }
  const maxScore = Math.max(100, ...allScores)
  const minScore = 0

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div style={{
        position: 'absolute', top: 4, left: 4, zIndex: 5,
        fontSize: '0.55rem', letterSpacing: '0.26em', color: 'var(--muted2)',
        textTransform: 'uppercase', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--teal)', boxShadow: '0 0 6px rgba(94,234,212,0.6)' }} />
        {label}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 28, right: 18, left: -10, bottom: 4 }}>
          <defs>
            <linearGradient id="trajGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="rgba(94,234,212,0.35)" />
              <stop offset="60%" stopColor="rgba(94,234,212,0.08)" />
              <stop offset="100%" stopColor="rgba(94,234,212,0)" />
            </linearGradient>
            <filter id="lineGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />

          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(241,242,246,0.34)', fontSize: 10, letterSpacing: 1 }}
            axisLine={false}
            tickLine={false}
            dy={4}
          />
          <YAxis
            domain={[minScore, maxScore]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: 'rgba(241,242,246,0.34)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={42}
          />

          <ReferenceLine
            y={target}
            stroke="rgba(241,242,246,0.34)"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: `Target ${target}%`,
              position: 'right',
              fill: 'rgba(241,242,246,0.5)',
              fontSize: 10,
              offset: 4,
            }}
          />

          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div style={{
                  background: 'rgba(10,12,18,0.92)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.08) inset',
                  minWidth: 170,
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--cream)', fontWeight: 600, marginBottom: 6 }}>
                    {d.fullName || d.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--cream)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--teal)' }} />
                    Score: {d.score != null ? `${d.score.toFixed(1)}%` : '—'}
                    {d.weight != null && <span style={{ color: 'var(--muted)' }}> · weight: {d.weight}%</span>}
                  </div>
                  {target != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(241,242,246,0.4)' }} />
                      Target: {target}%
                    </div>
                  )}
                </div>
              )
            }}
          />

          <Area
            type="monotone"
            dataKey="score"
            stroke="rgba(94,234,212,0.95)"
            strokeWidth={2}
            fill="url(#trajGrad)"
            dot={{ r: 4, fill: 'rgba(10,12,18,1)', stroke: 'rgba(94,234,212,1)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: 'var(--teal)', stroke: 'rgba(255,255,255,0.4)', strokeWidth: 2, filter: 'url(#lineGlow)' }}
            connectNulls
            isAnimationActive
            animationDuration={1100}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Per-assessment delta row — score with up/down arrow vs previous
───────────────────────────────────────────────────────────────────────────── */

function DeltaIndicator({ current, previous }) {
  if (current == null) return <Minus size={11} style={{ color: 'var(--muted2)' }} />
  if (previous == null) return null
  const diff = current - previous
  if (Math.abs(diff) < 0.5) return <Minus size={11} style={{ color: 'var(--muted)' }} />
  const color = diff > 0 ? 'var(--teal)' : 'var(--amber)'
  const Icon = diff > 0 ? ArrowUp : ArrowDown
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color, fontSize: '0.62rem', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
      <Icon size={10} />
      {Math.abs(diff).toFixed(1)}
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   SubjectCard — subject row with expansion to grade calculator
───────────────────────────────────────────────────────────────────────────── */

function SubjectCard({ subject, components, onUpdate, onDelete, onAddComponent, onUpdateComponent, onDeleteComponent, defaultTarget }) {
  const [expanded, setExpanded] = useState(false)
  const [addingComp, setAddingComp] = useState(false)
  const [compForm, setCompForm] = useState({ name: '', type: 'SAC', weight: '', score: '', maxScore: '100' })
  const [editingTarget, setEditingTarget] = useState(false)
  const { addToast } = useUIStore()

  const target = parseFloat(subject.targetScore ?? defaultTarget ?? 80)
  const weightedAvg = useMemo(() => calcWeightedAvg(components), [components])
  const effectiveScore = weightedAvg ?? subject.scaledScore ?? subject.rawScore ?? null
  const totalWeight = components.reduce((s, c) => s + parseFloat(c.weight || 0), 0)
  const sc = statusColor(effectiveScore, target)

  // Trajectory data for this subject — sorted by createdAt order, oldest first
  const trajectoryData = useMemo(() => {
    const sorted = [...components].reverse() // store has newest first; trajectory wants chronological
    return sorted.map((c, i) => ({
      label: i === 0 ? 'Start' : `#${i + 1}`,
      fullName: c.name,
      score: pctScore(c),
      weight: parseFloat(c.weight || 0),
    }))
  }, [components])

  function submitComponent() {
    if (!compForm.name || !compForm.weight) return
    onAddComponent({ ...compForm, subjectId: subject.id })
    addToast(`${compForm.name} added`, 'success')
    setCompForm({ name: '', type: 'SAC', weight: '', score: '', maxScore: '100' })
    setAddingComp(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Subject header row */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr auto auto auto auto',
          gap: 16, alignItems: 'center',
          padding: '18px 22px',
          cursor: 'pointer',
        }}
      >
        {/* Grade letter */}
        <div style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '2.2rem',
          color: sc,
          fontWeight: 200,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {getGradeLabel(effectiveScore)}
        </div>

        {/* Subject name + meta */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.95rem', color: 'var(--cream)', fontWeight: 500, marginBottom: 3 }}>
            {subject.name}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--muted2)', display: 'flex', gap: 10 }}>
            {subject.code   && <span>{subject.code}</span>}
            {subject.teacher && <span>· {subject.teacher}</span>}
            <span>· {components.length} component{components.length !== 1 ? 's' : ''}</span>
            {totalWeight > 0 && (
              <span style={{ color: totalWeight === 100 ? 'var(--teal)' : 'var(--amber)' }}>
                · {totalWeight.toFixed(0)}% weight {totalWeight === 100 ? 'balanced' : 'allocated'}
              </span>
            )}
          </div>

          {/* Weight progress bar — single tone, opacity differentiates filled vs unfilled */}
          {components.length > 0 && (
            <div style={{ display: 'flex', gap: 1.5, height: 3, borderRadius: 4, overflow: 'hidden', maxWidth: 320, marginTop: 8 }}>
              {components.map((c) => (
                <div key={c.id}
                  title={`${c.name}: ${c.weight}%`}
                  style={{
                    flex: parseFloat(c.weight || 0),
                    background: 'var(--cream)',
                    opacity: c.score !== '' ? 0.85 : 0.18,
                    transition: 'flex 0.4s, opacity 0.3s',
                  }} />
              ))}
              {totalWeight < 100 && <div style={{ flex: 100 - totalWeight, background: 'rgba(255,255,255,0.04)' }} />}
            </div>
          )}
        </div>

        {/* Weighted average */}
        <div style={{ textAlign: 'right', minWidth: 80 }}>
          {weightedAvg != null ? (
            <>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '2.1rem', color: 'var(--cream)',
                lineHeight: 1, fontWeight: 200, letterSpacing: '-0.02em',
              }}>
                {weightedAvg.toFixed(1)}
                <span style={{ fontSize: '0.7rem', color: 'var(--muted2)', marginLeft: 2 }}>%</span>
              </div>
              <div style={{ fontSize: '0.5rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginTop: 4 }}>
                weighted
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.68rem', color: 'var(--muted2)' }}>
              {components.length ? 'add scores' : 'no data'}
            </div>
          )}
        </div>

        {/* vs target */}
        <div style={{ textAlign: 'right', minWidth: 70 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.78rem',
            color: weightedAvg != null
              ? (weightedAvg >= target ? 'var(--teal)' : 'var(--amber)')
              : 'var(--muted2)',
            lineHeight: 1,
          }}>
            {weightedAvg != null
              ? `${weightedAvg >= target ? '+' : ''}${(weightedAvg - target).toFixed(1)}`
              : '—'}
          </div>
          <div style={{ fontSize: '0.5rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.22em', marginTop: 6 }}>
            vs {target}%
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(subject.id) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted2)', padding: 6, display: 'flex' }}
          aria-label="Delete subject"
        >
          <Trash2 size={13} />
        </button>

        <div style={{ color: 'var(--muted)', display: 'flex' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded: grade components + per-subject trajectory */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.18)' }}
          >
            <div style={{ padding: '20px 24px' }}>

              {/* Per-subject trajectory chart */}
              {components.length > 0 && (
                <div style={{
                  marginBottom: 20,
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 14,
                  padding: '12px 14px 8px',
                }}>
                  <TrajectoryChart data={trajectoryData} target={target} height={220} label={`${subject.name.toUpperCase()} TRAJECTORY`} />
                </div>
              )}

              {/* Customizable target editor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: '0.7rem', color: 'var(--muted)' }}>
                <Target size={11} />
                <span>Target score:</span>
                {editingTarget ? (
                  <>
                    <input
                      autoFocus
                      type="number"
                      min={0} max={100}
                      defaultValue={target}
                      onBlur={(e) => {
                        const v = parseFloat(e.target.value)
                        if (!isNaN(v) && v >= 0 && v <= 100) onUpdate(subject.id, { targetScore: v })
                        setEditingTarget(false)
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur() }}
                      className="input-base"
                      style={{ width: 70, padding: '4px 8px', fontSize: '0.78rem', textAlign: 'center' }}
                    />
                    <span>%</span>
                  </>
                ) : (
                  <button
                    onClick={() => setEditingTarget(true)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'var(--cream)',
                      borderRadius: 6,
                      padding: '3px 10px',
                      fontSize: '0.72rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      cursor: 'pointer',
                    }}>
                    {target}%
                  </button>
                )}
              </div>

              {/* Component table header */}
              {components.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 90px 80px 70px 70px 28px', gap: 8, padding: '4px 0 8px', fontSize: '0.52rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 700 }}>
                  <span>Assessment</span>
                  <span style={{ textAlign: 'center' }}>Type</span>
                  <span style={{ textAlign: 'center' }}>Weight</span>
                  <span style={{ textAlign: 'center' }}>Score</span>
                  <span style={{ textAlign: 'center' }}>Out of</span>
                  <span style={{ textAlign: 'center' }}>Result</span>
                  <span style={{ textAlign: 'center' }}>Δ</span>
                  <span />
                </div>
              )}

              {/* Component rows — chronological for delta calc */}
              <AnimatePresence>
                {[...components].reverse().map((c, i, arr) => {
                  const pct = pctScore(c)
                  const prevPct = i > 0 ? pctScore(arr[i - 1]) : null
                  const contribution = pct != null && c.weight ? (pct * parseFloat(c.weight) / (totalWeight || 100)) : null

                  return (
                    <motion.div key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 90px 80px 90px 80px 70px 70px 28px',
                        gap: 8, alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}>
                      <div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--cream)' }}>{c.name}</div>
                        <div style={{ height: 2, borderRadius: 2, background: pct != null ? statusColor(pct, target) : 'rgba(255,255,255,0.06)', opacity: 0.55, width: pct != null ? `${Math.min(100, pct)}%` : '0%', transition: 'width 0.5s, background 0.3s', marginTop: 4 }} />
                      </div>
                      <select
                        className="input-base"
                        value={c.type}
                        onChange={e => onUpdateComponent(c.id, { type: e.target.value })}
                        style={{ padding: '4px 6px', fontSize: '0.65rem', textAlign: 'center' }}
                      >
                        {COMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <input type="number" className="input-base" value={c.weight} placeholder="%" onChange={e => onUpdateComponent(c.id, { weight: e.target.value })}
                        style={{ padding: '4px 6px', fontSize: '0.75rem', textAlign: 'center' }} />
                      <input type="number" className="input-base" value={c.score} placeholder="—" onChange={e => onUpdateComponent(c.id, { score: e.target.value })}
                        style={{
                          padding: '4px 6px', fontSize: '0.75rem', textAlign: 'center',
                          borderColor: c.score !== '' ? statusColor(pct, target) + '60' : 'rgba(255,255,255,0.07)',
                        }} />
                      <input type="number" className="input-base" value={c.maxScore} onChange={e => onUpdateComponent(c.id, { maxScore: e.target.value })}
                        style={{ padding: '4px 6px', fontSize: '0.75rem', textAlign: 'center' }} />
                      <div style={{ textAlign: 'center' }}>
                        {pct != null ? (
                          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', fontWeight: 300, color: statusColor(pct, target) }}>
                            {pct.toFixed(1)}%
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted2)' }}>—</span>
                        )}
                        {contribution != null && (
                          <div style={{ fontSize: '0.55rem', color: 'var(--muted2)', marginTop: 1 }}>
                            +{contribution.toFixed(1)} contrib.
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <DeltaIndicator current={pct} previous={prevPct} />
                      </div>
                      <button onClick={() => onDeleteComponent(c.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted2)', display: 'flex', justifyContent: 'center' }}>
                        <Trash2 size={11} />
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Weighted total summary row */}
              {components.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 4px', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 6 }}>
                  <div style={{ fontSize: '0.66rem', color: 'var(--muted)' }}>
                    {totalWeight !== 100 && (
                      <span style={{ color: 'var(--amber)', marginRight: 10 }}>
                        ⚠ Weights sum to {totalWeight.toFixed(0)}% (needs 100%)
                      </span>
                    )}
                    {totalWeight === 100 && <span style={{ color: 'var(--teal)' }}>✓ Weights balanced</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontSize: '0.55rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 700 }}>Weighted Average</span>
                    <span style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      fontSize: '1.9rem',
                      color: weightedAvg != null ? (weightedAvg >= target ? 'var(--teal)' : 'var(--cream)') : 'var(--muted2)',
                      fontWeight: 200,
                      letterSpacing: '-0.02em',
                    }}>
                      {weightedAvg != null ? `${weightedAvg.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                </div>
              )}

              {/* Add component form */}
              <AnimatePresence>
                {addingComp && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginTop: 14 }}>
                    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 700, marginBottom: 12 }}>New Assessment</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <input className="input-base" placeholder="Name (e.g. SAC 1, Final Exam)" value={compForm.name} onChange={e => setCompForm({ ...compForm, name: e.target.value })} />
                        <select className="input-base" value={compForm.type} onChange={e => setCompForm({ ...compForm, type: e.target.value })}>
                          {COMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <input className="input-base" type="number" placeholder="Weight %" value={compForm.weight} onChange={e => setCompForm({ ...compForm, weight: e.target.value })} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                        <input className="input-base" type="number" placeholder="Score earned (optional)" value={compForm.score} onChange={e => setCompForm({ ...compForm, score: e.target.value })} />
                        <input className="input-base" type="number" placeholder="Max score" value={compForm.maxScore} onChange={e => setCompForm({ ...compForm, maxScore: e.target.value })} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" style={{ padding: '7px 16px' }} onClick={submitComponent}>Add</button>
                        <button className="btn btn-ghost" style={{ padding: '7px 12px' }} onClick={() => { setAddingComp(false); setCompForm({ name: '', type: 'SAC', weight: '', score: '', maxScore: '100' }) }}>Cancel</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!addingComp && (
                <button onClick={() => setAddingComp(true)}
                  style={{
                    marginTop: 14, display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px dashed rgba(255,255,255,0.12)',
                    borderRadius: 8, padding: '9px 14px', cursor: 'pointer',
                    color: 'var(--muted)', fontSize: '0.7rem', width: '100%', justifyContent: 'center',
                    transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.045)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'
                    e.currentTarget.style.color = 'var(--cream)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                    e.currentTarget.style.color = 'var(--muted)'
                  }}>
                  <Plus size={12} /> Add Assessment
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────────────────────── */

export default function Academics() {
  const {
    subjects, addSubject, updateSubject, deleteSubject,
    gradeComponents, addGradeComponent, updateGradeComponent, deleteGradeComponent,
    profile, updateProfile,
  } = useLocalStore()
  const { addToast } = useUIStore()

  const [adding, setAdding] = useState(false)
  const [whatIfSubject, setWhatIfSubject] = useState('')
  const [whatIfScore_, setWhatIfScore_] = useState(70)
  const [form, setForm] = useState({ name: '', teacher: '', code: '', targetScore: 80 })

  const defaultTarget = parseFloat(profile?.defaultTargetScore ?? 80)
  const targetAtar = parseFloat(profile?.targetAtar ?? 90)

  const atar = useMemo(() => estimateATAR(subjects, gradeComponents), [subjects, gradeComponents])

  const subjectScores = useMemo(() => subjects.map(s => {
    const comps = gradeComponents.filter(c => c.subjectId === s.id)
    const weighted = calcWeightedAvg(comps)
    return { ...s, effectiveScore: weighted ?? s.scaledScore ?? s.rawScore ?? null, target: parseFloat(s.targetScore ?? defaultTarget) }
  }), [subjects, gradeComponents, defaultTarget])

  const whatIfAtar = whatIfSubject
    ? (() => {
        const modified = subjects.map(s => {
          if (s.id !== whatIfSubject) return s
          return { ...s, scaledScore: whatIfScore_, rawScore: whatIfScore_ }
        })
        return estimateATAR(modified, gradeComponents.filter(c => c.subjectId !== whatIfSubject))
      })()
    : atar

  const atarDiff = whatIfAtar != null && atar != null ? (whatIfAtar - atar) : null

  const avgEffective = subjectScores.length
    ? (subjectScores.reduce((s, sub) => s + parseFloat(sub.effectiveScore || 0), 0) / subjectScores.length)
    : null

  // All-subjects trajectory — chronological assessments across all subjects
  const allTrajectory = useMemo(() => {
    const all = gradeComponents
      .filter(c => c.score !== '' && parseFloat(c.maxScore) > 0)
      .slice().reverse() // store newest-first → chronological
    return all.map((c, i) => {
      const subj = subjects.find(s => s.id === c.subjectId)
      return {
        label: i === 0 ? 'Start' : `#${i + 1}`,
        fullName: `${c.name}${subj ? ` · ${subj.name}` : ''}`,
        score: pctScore(c),
        weight: parseFloat(c.weight || 0),
      }
    })
  }, [gradeComponents, subjects])

  function submit() {
    if (!form.name) return
    addSubject(form)
    addToast('Subject added', 'success')
    setAdding(false)
    setForm({ name: '', teacher: '', code: '', targetScore: defaultTarget })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Academics</h1>
        <p className="page-subtitle">Weighted grades · per-assessment trajectory · ATAR projection</p>
      </div>

      {/* HERO — weighted average + score trajectory.
          Asymmetric: 2/3 chart + 1/3 hero KPIs. */}
      <div className="grid-hero" style={{ marginBottom: 20 }}>

        {/* Trajectory chart — primary feature */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="glass glass-premium"
          style={{ padding: '24px 26px 14px', position: 'relative' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div>
              <div style={{
                fontSize: '0.5rem', letterSpacing: '0.28em', color: 'var(--muted2)',
                textTransform: 'uppercase', fontWeight: 700, marginBottom: 8,
              }}>
                Score Trajectory
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <div className="etched" style={{ fontSize: '3.6rem', lineHeight: 0.95 }}>
                  {avgEffective != null ? avgEffective.toFixed(1) : '—'}
                  <span style={{ fontSize: '1rem', color: 'var(--muted2)', marginLeft: 4 }}>%</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.22em' }}>
                    avg across {subjects.length} subj
                  </span>
                  {avgEffective != null && (
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.78rem',
                      color: avgEffective >= defaultTarget ? 'var(--teal)' : 'var(--amber)',
                    }}>
                      {avgEffective >= defaultTarget ? '+' : ''}{(avgEffective - defaultTarget).toFixed(1)} vs target
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <TrajectoryChart data={allTrajectory} target={defaultTarget} height={260} label="ALL ASSESSMENTS" />
        </motion.div>

        {/* Hero KPI stack */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* ATAR */}
          <div className="glass" style={{ padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            <div className="stat-label">Estimated ATAR</div>
            <div className="etched" style={{ fontSize: '3.2rem' }}>
              {atar != null ? atar.toFixed(2) : '—'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span className="stat-sub">Top 4 weighted</span>
              {atar != null && (
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.66rem',
                  color: atar >= targetAtar ? 'var(--teal)' : 'var(--amber)',
                }}>
                  {atar >= targetAtar ? '+' : ''}{(atar - targetAtar).toFixed(2)} vs target {targetAtar}
                </span>
              )}
            </div>
            {/* Progress bar to target ATAR */}
            <div className="progress-track" style={{ marginTop: 12 }}>
              <div
                className="progress-fill"
                style={{
                  width: `${atar != null ? Math.min(100, (atar / 99.95) * 100) : 0}%`,
                  background: atar != null && atar >= targetAtar ? 'var(--teal)' : 'rgba(241,242,246,0.55)',
                  opacity: 0.85,
                }}
              />
            </div>
          </div>

          {/* Subjects + components */}
          <div className="glass" style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div className="stat-label">Subjects</div>
              <div className="etched" style={{ fontSize: '2.2rem' }}>{subjects.length}</div>
              <div className="stat-sub">Tracked</div>
            </div>
            <div>
              <div className="stat-label">Assessments</div>
              <div className="etched" style={{ fontSize: '2.2rem' }}>{gradeComponents.length}</div>
              <div className="stat-sub">Logged</div>
            </div>
          </div>

          {/* Default target — customizable */}
          <div className="glass" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-label">Default target</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Used when a subject has no override</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number"
                min={0} max={100}
                value={defaultTarget}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  if (!isNaN(v) && v >= 0 && v <= 100) updateProfile({ defaultTargetScore: v })
                }}
                className="input-base"
                style={{ width: 70, padding: '5px 8px', fontSize: '0.85rem', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* What-If simulator + grade ladder */}
      <div className="grid-2" style={{ marginBottom: 20 }}>

        {/* What-if simulator */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="glass" style={{ padding: 24 }}>
          <div className="section-header">
            <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calculator size={11} /> What-If Simulator
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 18, lineHeight: 1.65 }}>
            Adjust a hypothetical score to see its impact on your projected ATAR.
          </p>
          <select className="input-base" value={whatIfSubject} onChange={e => setWhatIfSubject(e.target.value)} style={{ marginBottom: 14 }}>
            <option value="">Select a subject…</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {whatIfSubject ? (
            <>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.66rem', color: 'var(--muted)', marginBottom: 8 }}>
                  <span>Hypothetical score</span>
                  <span className="etched" style={{ fontSize: '1.6rem' }}>{whatIfScore_}%</span>
                </div>
                <input type="range" min={0} max={100} step={0.5} value={whatIfScore_} onChange={e => setWhatIfScore_(+e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--cream)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'var(--muted2)', marginTop: 3 }}>
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 16px', textAlign: 'center' }}>
                <div className="stat-label">Projected ATAR</div>
                <div className="etched" style={{ fontSize: '3.4rem' }}>{whatIfAtar != null ? whatIfAtar.toFixed(2) : '—'}</div>
                {atarDiff != null && (
                  <div style={{
                    fontSize: '0.7rem', marginTop: 6,
                    color: atarDiff > 0 ? 'var(--teal)' : atarDiff < 0 ? 'var(--amber)' : 'var(--muted)',
                    fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {atarDiff > 0 ? '+' : ''}{atarDiff.toFixed(2)} vs current
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--muted2)', padding: '24px 0', fontSize: '0.78rem' }}>
              {subjects.length === 0 ? 'Add a subject first.' : 'Pick a subject above.'}
            </div>
          )}
        </motion.div>

        {/* Grade ladder — visual reference for grade thresholds */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass" style={{ padding: 24 }}>
          <div className="section-header">
            <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={11} /> Grade Ladder
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'A+', range: '90 – 100', threshold: 90 },
              { label: 'A',  range: '80 – 89',  threshold: 80 },
              { label: 'B',  range: '70 – 79',  threshold: 70 },
              { label: 'C',  range: '60 – 69',  threshold: 60 },
              { label: 'D',  range: '50 – 59',  threshold: 50 },
              { label: 'E',  range: '< 50',     threshold: 0 },
            ].map((g) => {
              const count = subjectScores.filter(s => s.effectiveScore != null && parseFloat(s.effectiveScore) >= g.threshold && (g.threshold === 90 ? true : parseFloat(s.effectiveScore) < g.threshold + 10)).length
              const isCurrent = avgEffective != null && parseFloat(avgEffective) >= g.threshold && (g.threshold === 90 ? true : parseFloat(avgEffective) < g.threshold + 10)
              return (
                <div key={g.label} style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: 14, alignItems: 'center',
                  padding: '8px 12px',
                  background: isCurrent ? 'rgba(94,234,212,0.06)' : 'transparent',
                  borderRadius: 8,
                  border: isCurrent ? '1px solid rgba(94,234,212,0.18)' : '1px solid transparent',
                  transition: 'background 0.3s, border-color 0.3s',
                }}>
                  <span style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '1.4rem', fontWeight: 200,
                    color: isCurrent ? 'var(--teal)' : 'var(--cream)',
                    letterSpacing: '-0.02em',
                  }}>
                    {g.label}
                  </span>
                  <div style={{ height: 1, background: `linear-gradient(90deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 100%)` }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>{g.range}</span>
                  <span style={{
                    fontSize: '0.6rem', color: count > 0 ? 'var(--cream)' : 'var(--muted2)',
                    minWidth: 50, textAlign: 'right',
                  }}>
                    {count > 0 ? `${count} subj` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Subject cards */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="glass" style={{ padding: 24 }}>
        <div className="section-header">
          <span className="section-title">
            <BookOpen size={11} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Subjects &amp; Assessments
          </span>
          <button className="btn btn-primary" style={{ padding: '7px 14px' }} onClick={() => setAdding(v => !v)}>
            <Plus size={14} /> {adding ? 'Cancel' : 'Add Subject'}
          </button>
        </div>

        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 18, lineHeight: 1.65 }}>
          Click any subject to expand. Add weighted assessments — the running weighted average and trajectory chart update live, with each assessment's delta vs the previous shown.
        </p>

        <AnimatePresence>
          {adding && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 700, marginBottom: 14 }}>New Subject</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <input className="input-base" placeholder="Name (e.g. Mathematics Methods)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <input className="input-base" placeholder="Code (e.g. MAT)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                  <input className="input-base" placeholder="Teacher (optional)" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} />
                  <input className="input-base" type="number" min={0} max={100} placeholder={`Target %`} value={form.targetScore} onChange={e => setForm({ ...form, targetScore: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={submit}>Add Subject</button>
                  <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {subjects.length === 0 && !adding ? (
          <div style={{ textAlign: 'center', color: 'var(--muted2)', padding: '48px 0', fontSize: '0.82rem' }}>
            <Target size={28} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
            No subjects yet. Add your subjects to start tracking weighted grades.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence>
              {subjects.map(s => (
                <SubjectCard
                  key={s.id}
                  subject={s}
                  components={gradeComponents.filter(c => c.subjectId === s.id)}
                  onUpdate={(id, updates) => updateSubject(id, updates)}
                  onDelete={deleteSubject}
                  onAddComponent={addGradeComponent}
                  onUpdateComponent={updateGradeComponent}
                  onDeleteComponent={deleteGradeComponent}
                  defaultTarget={defaultTarget}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}
