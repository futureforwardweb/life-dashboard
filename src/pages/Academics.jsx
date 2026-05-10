import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, BookOpen, Calculator, ChevronDown, ChevronUp, Target, TrendingUp, Award, Layers } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

// ── helpers ──────────────────────────────────────────────────────────────────

function calcWeightedAvg(components) {
  const filled = components.filter(c => c.score !== '' && c.maxScore && parseFloat(c.maxScore) > 0 && c.weight)
  if (!filled.length) return null
  const totalWeight = filled.reduce((s, c) => s + parseFloat(c.weight || 0), 0)
  if (!totalWeight) return null
  const weightedSum = filled.reduce((s, c) => {
    const pct = (parseFloat(c.score) / parseFloat(c.maxScore)) * 100
    return s + pct * parseFloat(c.weight)
  }, 0)
  return (weightedSum / totalWeight).toFixed(2)
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
  return Math.min(99.95, Math.max(0, (avg - 50) * 1.8 + 60)).toFixed(2)
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

function getGradeColor(score) {
  if (score == null || score === '') return 'var(--muted)'
  const n = parseFloat(score)
  if (n >= 80) return 'var(--sage)'
  if (n >= 65) return 'var(--amber)'
  if (n >= 50) return 'var(--clay)'
  return 'var(--rose)'
}

const COMP_TYPES = [
  { value: 'SAC', label: 'SAC', color: 'var(--dusk)' },
  { value: 'Exam', label: 'Exam', color: 'var(--rose)' },
  { value: 'Assignment', label: 'Assignment', color: 'var(--amber)' },
  { value: 'Test', label: 'Test', color: 'var(--sage)' },
  { value: 'Practical', label: 'Practical', color: 'var(--teal)' },
  { value: 'Other', label: 'Other', color: 'var(--clay)' },
]

function getTypeColor(type) {
  return COMP_TYPES.find(t => t.value === type)?.color ?? 'var(--muted)'
}

// ── SubjectCard ───────────────────────────────────────────────────────────────

function SubjectCard({ subject, components, onUpdate, onDelete, onAddComponent, onUpdateComponent, onDeleteComponent }) {
  const [expanded, setExpanded] = useState(false)
  const [addingComp, setAddingComp] = useState(false)
  const [compForm, setCompForm] = useState({ name: '', type: 'SAC', weight: '', score: '', maxScore: '100' })
  const { addToast } = useUIStore()

  const weightedAvg = useMemo(() => calcWeightedAvg(components), [components])
  const effectiveScore = weightedAvg ?? subject.scaledScore ?? subject.rawScore ?? null
  const totalWeight = components.reduce((s, c) => s + parseFloat(c.weight || 0), 0)
  const gc = getGradeColor(effectiveScore)

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
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${effectiveScore ? gc + '35' : 'var(--border)'}`,
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'border-color 0.3s',
      }}
    >
      {/* Subject header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, alignItems: 'center', padding: '16px 20px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: gc, fontWeight: 600, lineHeight: 1 }}>
              {getGradeLabel(effectiveScore)}
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', color: 'var(--cream)', fontWeight: 500 }}>{subject.name}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>
                {subject.code && <span style={{ marginRight: 6 }}>{subject.code}</span>}
                {subject.teacher && <span>{subject.teacher}</span>}
              </div>
            </div>
          </div>

          {/* Weight progress bar */}
          {components.length > 0 && (
            <div style={{ display: 'flex', gap: 2, height: 4, borderRadius: 4, overflow: 'hidden', maxWidth: 280, marginTop: 6 }}>
              {components.map((c, i) => (
                <div key={c.id} title={`${c.name}: ${c.weight}%`}
                  style={{ flex: parseFloat(c.weight || 0), background: getTypeColor(c.type), opacity: c.score !== '' ? 1 : 0.3, transition: 'flex 0.4s' }} />
              ))}
              {totalWeight < 100 && <div style={{ flex: 100 - totalWeight, background: 'var(--border)' }} />}
            </div>
          )}
        </div>

        {/* Weighted avg display */}
        <div style={{ textAlign: 'center', minWidth: 72 }}>
          {weightedAvg ? (
            <>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color: gc, lineHeight: 1, fontWeight: 600 }}>{parseFloat(weightedAvg).toFixed(1)}</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>weighted %</div>
            </>
          ) : (
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>
              {components.length ? 'add scores' : 'no data'}
            </div>
          )}
        </div>

        {/* Components count badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {components.length} comp{components.length !== 1 ? 's' : ''}
          </div>
          {totalWeight > 0 && (
            <div style={{ fontSize: '0.6rem', color: totalWeight === 100 ? 'var(--sage)' : 'var(--amber)' }}>
              {totalWeight.toFixed(0)}% total
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setExpanded(v => !v); if (!expanded) setAddingComp(false) }}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.65rem' }}>
            <Layers size={12} /> {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button onClick={() => onDelete(subject.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.45, padding: 6 }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded: grade components */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '16px 20px' }}>

              {/* Component table header */}
              {components.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px 80px 28px', gap: 8, padding: '4px 0 8px', fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600 }}>
                  <span>Component</span>
                  <span style={{ textAlign: 'center' }}>Type</span>
                  <span style={{ textAlign: 'center' }}>Weight %</span>
                  <span style={{ textAlign: 'center' }}>Score</span>
                  <span style={{ textAlign: 'center' }}>Out of</span>
                  <span style={{ textAlign: 'center' }}>Contribution</span>
                  <span />
                </div>
              )}

              {/* Component rows */}
              <AnimatePresence>
                {components.map(c => {
                  const pct = c.score !== '' && parseFloat(c.maxScore) > 0
                    ? (parseFloat(c.score) / parseFloat(c.maxScore)) * 100
                    : null
                  const contribution = pct != null && c.weight ? (pct * parseFloat(c.weight) / (totalWeight || 100)).toFixed(1) : null
                  const typeColor = getTypeColor(c.type)

                  return (
                    <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px 80px 28px', gap: 8, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--cream)' }}>{c.name}</div>
                        <div style={{ height: 2, borderRadius: 2, background: typeColor, opacity: 0.5, width: pct ? `${pct}%` : '0%', maxWidth: '100%', transition: 'width 0.5s', marginTop: 3 }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 600, color: typeColor, padding: '2px 6px', background: typeColor + '18', borderRadius: 4 }}>{c.type}</span>
                      </div>
                      <input type="number" className="input-base" value={c.weight} placeholder="%" onChange={e => onUpdateComponent(c.id, { weight: e.target.value })}
                        style={{ padding: '4px 6px', fontSize: '0.75rem', textAlign: 'center' }} />
                      <input type="number" className="input-base" value={c.score} placeholder="—" onChange={e => onUpdateComponent(c.id, { score: e.target.value })}
                        style={{ padding: '4px 6px', fontSize: '0.75rem', textAlign: 'center', borderColor: c.score !== '' ? getGradeColor(pct) + '60' : 'var(--border)' }} />
                      <input type="number" className="input-base" value={c.maxScore} onChange={e => onUpdateComponent(c.id, { maxScore: e.target.value })}
                        style={{ padding: '4px 6px', fontSize: '0.75rem', textAlign: 'center' }} />
                      <div style={{ textAlign: 'center' }}>
                        {contribution != null ? (
                          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: getGradeColor(pct) }}>{contribution}%</span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>—</span>
                        )}
                      </div>
                      <button onClick={() => onDeleteComponent(c.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.4, display: 'flex', justifyContent: 'center' }}>
                        <Trash2 size={11} />
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Weighted total summary row */}
              {components.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 4px', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 4 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>
                    {totalWeight !== 100 && (
                      <span style={{ color: 'var(--amber)', marginRight: 10 }}>⚠ Weights sum to {totalWeight.toFixed(0)}% (needs 100%)</span>
                    )}
                    {totalWeight === 100 && <span style={{ color: 'var(--sage)' }}>✓ Weights balanced</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Weighted Average</span>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: gc, fontWeight: 600 }}>
                      {weightedAvg ? `${parseFloat(weightedAvg).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                </div>
              )}

              {/* Add component form */}
              <AnimatePresence>
                {addingComp && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginTop: 12 }}>
                    <div style={{ background: 'rgba(155,143,212,0.06)', border: '1px solid rgba(155,143,212,0.15)', borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--dusk)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 12 }}>New Component</div>
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
                  style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(155,143,212,0.08)', border: '1px dashed rgba(155,143,212,0.25)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--dusk)', fontSize: '0.72rem', width: '100%', justifyContent: 'center' }}>
                  <Plus size={12} /> Add Grade Component
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Academics() {
  const { subjects, addSubject, updateSubject, deleteSubject, gradeComponents, addGradeComponent, updateGradeComponent, deleteGradeComponent } = useLocalStore()
  const { addToast } = useUIStore()

  const [adding, setAdding] = useState(false)
  const [whatIfSubject, setWhatIfSubject] = useState('')
  const [whatIfScore_, setWhatIfScore_] = useState(70)
  const [form, setForm] = useState({ name: '', teacher: '', code: '' })

  const atar = useMemo(() => estimateATAR(subjects, gradeComponents), [subjects, gradeComponents])

  const subjectScores = useMemo(() => subjects.map(s => {
    const comps = gradeComponents.filter(c => c.subjectId === s.id)
    const weighted = calcWeightedAvg(comps)
    return { ...s, effectiveScore: weighted ?? s.scaledScore ?? s.rawScore ?? null }
  }), [subjects, gradeComponents])

  const whatIfAtar = whatIfSubject
    ? (() => {
        const modified = subjects.map(s => {
          if (s.id !== whatIfSubject) return s
          return { ...s, scaledScore: whatIfScore_, rawScore: whatIfScore_ }
        })
        return estimateATAR(modified, gradeComponents.filter(c => c.subjectId !== whatIfSubject))
      })()
    : atar
  const atarDiff = whatIfAtar && atar ? (parseFloat(whatIfAtar) - parseFloat(atar)).toFixed(2) : null

  const avgEffective = subjectScores.length
    ? (subjectScores.reduce((s, sub) => s + parseFloat(sub.effectiveScore || 0), 0) / subjectScores.length).toFixed(1)
    : null

  const chartData = subjectScores.map(s => ({
    name: s.code || s.name.slice(0, 5),
    score: parseFloat(s.effectiveScore || 0),
    color: getGradeColor(s.effectiveScore),
  }))

  function submit() {
    if (!form.name) return
    addSubject(form)
    addToast('Subject added', 'success')
    setAdding(false)
    setForm({ name: '', teacher: '', code: '' })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Academics</h1>
        <p className="page-subtitle">Weighted grade calculator · ATAR estimator · subject tracking</p>
      </div>

      {/* Hero stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Est. ATAR', value: atar ?? '—', sub: 'Top 4 weighted averages', color: 'var(--amber)', icon: Award },
          { label: 'Subjects', value: subjects.length, sub: 'Tracked this year', color: 'var(--dusk)', icon: BookOpen },
          { label: 'Avg Score', value: avgEffective ?? '—', sub: 'Weighted average', color: 'var(--sage)', icon: TrendingUp },
          { label: 'Components', value: gradeComponents.length, sub: 'Grade entries total', color: 'var(--clay)', icon: Layers },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="glass stat-card" style={{ borderLeft: `3px solid ${s.color}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 10, right: 12, opacity: 0.06 }}>
                <Icon size={36} color={s.color} />
              </div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Grade chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass" style={{ padding: 24 }}>
          <div className="section-header"><span className="section-title">Score Overview</span></div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barCategoryGap="35%">
                <XAxis dataKey="name" tick={{ fill: 'rgba(242,237,228,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'rgba(242,237,228,0.35)', fontSize: 9 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: 'var(--ink3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${parseFloat(v).toFixed(1)}%`, 'Weighted Avg']}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.82rem', textAlign: 'center' }}>
              Add subjects and grade components to see your chart
            </div>
          )}

          {/* Grade legend */}
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            {[['A+ ≥90', 'var(--sage)'], ['A ≥80', 'var(--sage)'], ['B ≥70', 'var(--amber)'], ['C ≥60', 'var(--clay)'], ['D ≥50', 'var(--clay)'], ['E <50', 'var(--rose)']].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.58rem', color: 'var(--muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                {l}
              </div>
            ))}
          </div>
        </motion.div>

        {/* What-if simulator */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass" style={{ padding: 24 }}>
          <div className="section-header">
            <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calculator size={13} /> What-If Simulator
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 18, lineHeight: 1.65 }}>
            Adjust a score to simulate its impact on your estimated ATAR.
          </p>
          <select className="input-base" value={whatIfSubject} onChange={e => setWhatIfSubject(e.target.value)} style={{ marginBottom: 14 }}>
            <option value="">Select a subject…</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {whatIfSubject && (
            <>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.68rem', color: 'var(--muted)', marginBottom: 8 }}>
                  <span>Hypothetical score</span>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: getGradeColor(whatIfScore_) }}>{whatIfScore_}%</span>
                </div>
                <input type="range" min={0} max={100} step={0.5} value={whatIfScore_} onChange={e => setWhatIfScore_(+e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--dusk)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--muted)', marginTop: 3 }}>
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
              <div style={{ background: 'rgba(155,143,212,0.08)', border: '1px solid rgba(155,143,212,0.18)', borderRadius: 14, padding: '20px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 6 }}>Projected ATAR</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '3.2rem', color: 'var(--dusk)', lineHeight: 1 }}>{whatIfAtar ?? '—'}</div>
                {atarDiff && (
                  <div style={{ fontSize: '0.72rem', marginTop: 8, color: parseFloat(atarDiff) > 0 ? 'var(--sage)' : parseFloat(atarDiff) < 0 ? 'var(--rose)' : 'var(--muted)', fontWeight: 600 }}>
                    {parseFloat(atarDiff) > 0 ? '+' : ''}{atarDiff} vs current estimate
                  </div>
                )}
              </div>
            </>
          )}
          {!whatIfSubject && (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0', fontSize: '0.78rem' }}>
              {subjects.length === 0 ? 'Add subjects first.' : 'Pick a subject above.'}
            </div>
          )}
        </motion.div>
      </div>

      {/* Subject cards */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass" style={{ padding: 24 }}>
        <div className="section-header">
          <span className="section-title">
            <BookOpen size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Subjects &amp; Grade Calculator
          </span>
          <button className="btn btn-primary" style={{ padding: '7px 14px' }} onClick={() => setAdding(v => !v)}>
            <Plus size={14} /> {adding ? 'Cancel' : 'Add Subject'}
          </button>
        </div>

        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 18, lineHeight: 1.65 }}>
          Expand any subject to add individual grade components (SACs, exams, assignments). Enter weight % and scores — the weighted average is calculated automatically.
        </p>

        <AnimatePresence>
          {adding && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ background: 'rgba(155,143,212,0.06)', border: '1px solid rgba(155,143,212,0.2)', borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--dusk)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 14 }}>New Subject</div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <input className="input-base" placeholder="Subject name (e.g. Mathematics Methods)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <input className="input-base" placeholder="Code (e.g. MAT)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                  <input className="input-base" placeholder="Teacher (optional)" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} />
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
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px 0', fontSize: '0.82rem' }}>
            <Target size={28} style={{ opacity: 0.2, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
            No subjects yet. Add your subjects to start the weighted grade calculator.
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
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Type legend */}
      {gradeComponents.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {COMP_TYPES.map(t => (
            <div key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.6rem', color: 'var(--muted)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: t.color }} />
              {t.label}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
