import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Trophy, Target, Zap } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'
import { formatAWST } from '../lib/time'
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

const TRAINING_TYPES = ['Team Practice', 'Individual Training', 'Gym', 'Conditioning', 'Video Review', 'Skills Session']
const RESULTS = ['win', 'loss', 'draw']
const RESULT_COLOR = { win: 'var(--sage)', loss: 'var(--rose)', draw: 'var(--dusk)' }

export default function Athletics() {
  const { games, addGame, updateGame, trainingSessions, addTrainingSession } = useLocalStore()
  const { addToast } = useUIStore()
  const [gameForm, setGameForm] = useState({ date: '', opponent: '', venue: '', result: 'win', pointsFor: '', pointsAgainst: '', notes: '' })
  const [trainForm, setTrainForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'Team Practice', duration: 90, notes: '' })
  const [tab, setTab] = useState('games')
  const [addingGame, setAddingGame] = useState(false)
  const [addingTrain, setAddingTrain] = useState(false)

  const wins = games.filter(g => g.result === 'win').length
  const losses = games.filter(g => g.result === 'loss').length
  const draws = games.filter(g => g.result === 'draw').length
  const totalPtsFor = games.reduce((s, g) => s + parseInt(g.pointsFor || 0), 0)
  const totalPtsAgainst = games.reduce((s, g) => s + parseInt(g.pointsAgainst || 0), 0)
  const winRate = games.length ? Math.round((wins / games.length) * 100) : 0
  const weekTraining = trainingSessions.filter(t => (Date.now() - new Date(t.date)) / 86400000 <= 7).length

  const chartData = games.slice(-8).map((g, i) => ({
    game: i + 1,
    for: parseInt(g.pointsFor || 0),
    against: parseInt(g.pointsAgainst || 0),
    result: g.result,
  }))

  function submitGame() {
    if (!gameForm.date || !gameForm.opponent) return
    addGame(gameForm)
    addToast('Game logged', 'success')
    setGameForm({ date: '', opponent: '', venue: '', result: 'win', pointsFor: '', pointsAgainst: '', notes: '' })
    setAddingGame(false)
  }

  function submitTrain() {
    if (!trainForm.date) return
    addTrainingSession(trainForm)
    addToast('Session logged', 'success')
    setAddingTrain(false)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Athletics</h1>
        <p className="page-subtitle">Games, results &amp; training sessions</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Wins', value: wins, color: 'var(--sage)', icon: Trophy },
          { label: 'Losses', value: losses, color: 'var(--rose)', icon: null },
          { label: 'Win Rate', value: games.length ? `${winRate}%` : '—', color: 'var(--dusk)', icon: Target },
          { label: 'Training / Wk', value: weekTraining, color: 'var(--clay)', icon: Zap },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="glass stat-card" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
              {s.icon && <s.icon size={18} color={s.color} style={{ opacity: 0.5 }} />}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Score chart */}
      {games.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass" style={{ padding: 24, marginBottom: 20 }}>
          <div className="section-header">
            <span className="section-title">Recent Game Scores</span>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.65rem', color: 'var(--muted)', alignItems: 'center' }}>
              <span>Total: {totalPtsFor} pts for · {totalPtsAgainst} against</span>
              <span style={{ color: totalPtsFor >= totalPtsAgainst ? 'var(--sage)' : 'var(--rose)', fontWeight: 600 }}>
                {totalPtsFor >= totalPtsAgainst ? '+' : ''}{totalPtsFor - totalPtsAgainst} diff
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} barCategoryGap="20%">
              <XAxis dataKey="game" tick={{ fill: 'rgba(242,237,228,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `G${v}`} />
              <Tooltip contentStyle={{ background: 'var(--ink3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="for" name="For" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={RESULT_COLOR[entry.result] || 'var(--dusk)'} fillOpacity={0.7} />
                ))}
              </Bar>
              <Bar dataKey="against" name="Against" fill="rgba(255,255,255,0.12)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['games', 'training'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontSize: '0.65rem', padding: '7px 18px', borderRadius: 99, border: '1px solid',
            textTransform: 'capitalize', letterSpacing: '0.1em', cursor: 'pointer',
            borderColor: tab === t ? 'var(--dusk)' : 'var(--border)',
            background: tab === t ? 'rgba(155,143,212,0.15)' : 'transparent',
            color: tab === t ? 'var(--dusk)' : 'var(--muted)',
          }}>{t}</button>
        ))}
      </div>

      {/* Games tab */}
      {tab === 'games' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass" style={{ padding: 24 }}>
          <div className="section-header">
            <span className="section-title">Game Log</span>
            <button className="btn btn-primary" style={{ padding: '7px 14px' }} onClick={() => setAddingGame(v => !v)}>
              <Plus size={14} /> {addingGame ? 'Cancel' : 'Log Game'}
            </button>
          </div>
          <AnimatePresence>
            {addingGame && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="glass-sm" style={{ padding: 18, marginBottom: 18, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <input type="date" className="input-base" value={gameForm.date} onChange={e => setGameForm({ ...gameForm, date: e.target.value })} />
                  <input className="input-base" placeholder="Opponent" value={gameForm.opponent} onChange={e => setGameForm({ ...gameForm, opponent: e.target.value })} />
                  <input className="input-base" placeholder="Venue (optional)" value={gameForm.venue} onChange={e => setGameForm({ ...gameForm, venue: e.target.value })} />
                  <select className="input-base" value={gameForm.result} onChange={e => setGameForm({ ...gameForm, result: e.target.value })}>
                    {RESULTS.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <input type="number" className="input-base" placeholder="Points for" value={gameForm.pointsFor} onChange={e => setGameForm({ ...gameForm, pointsFor: e.target.value })} />
                  <input type="number" className="input-base" placeholder="Points against" value={gameForm.pointsAgainst} onChange={e => setGameForm({ ...gameForm, pointsAgainst: e.target.value })} />
                </div>
                <textarea className="input-base" placeholder="Game notes" rows={2} value={gameForm.notes} onChange={e => setGameForm({ ...gameForm, notes: e.target.value })} style={{ marginBottom: 10, resize: 'vertical' }} />
                <button className="btn btn-primary" onClick={submitGame}>Save Game</button>
              </motion.div>
            )}
          </AnimatePresence>
          {games.map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0,
                background: `${RESULT_COLOR[g.result] || 'var(--dusk)'}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.62rem', fontWeight: 700, color: RESULT_COLOR[g.result] || 'var(--dusk)',
                textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {g.result || '—'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', color: 'var(--cream)', fontWeight: 500 }}>vs {g.opponent}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>
                  {g.date && formatAWST(new Date(g.date + 'T12:00:00'), 'EEE dd MMM')}
                  {g.venue ? ` · ${g.venue}` : ''}
                </div>
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: 'var(--cream)', letterSpacing: '0.02em' }}>
                <span style={{ color: RESULT_COLOR[g.result] || 'var(--cream)' }}>{g.pointsFor || 0}</span>
                <span style={{ color: 'var(--muted)', fontSize: '1rem' }}> – </span>
                {g.pointsAgainst || 0}
              </div>
            </div>
          ))}
          {games.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: '0.82rem' }}>No games logged yet</div>}
        </motion.div>
      )}

      {/* Training tab */}
      {tab === 'training' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass" style={{ padding: 24 }}>
          <div className="section-header">
            <span className="section-title">Training Sessions</span>
            <button className="btn btn-primary" style={{ padding: '7px 14px' }} onClick={() => setAddingTrain(v => !v)}>
              <Plus size={14} /> {addingTrain ? 'Cancel' : 'Log Session'}
            </button>
          </div>
          <AnimatePresence>
            {addingTrain && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="glass-sm" style={{ padding: 18, marginBottom: 18, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <input type="date" className="input-base" value={trainForm.date} onChange={e => setTrainForm({ ...trainForm, date: e.target.value })} />
                  <select className="input-base" value={trainForm.type} onChange={e => setTrainForm({ ...trainForm, type: e.target.value })}>
                    {TRAINING_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <div style={{ gridColumn: '1/-1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: 6 }}>
                      <span>Duration</span>
                      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: 'var(--clay)' }}>{trainForm.duration}m</span>
                    </div>
                    <input type="range" min={15} max={180} step={15} value={trainForm.duration} onChange={e => setTrainForm({ ...trainForm, duration: +e.target.value })} style={{ width: '100%', accentColor: 'var(--clay)' }} />
                  </div>
                </div>
                <textarea className="input-base" placeholder="Notes" rows={2} value={trainForm.notes} onChange={e => setTrainForm({ ...trainForm, notes: e.target.value })} style={{ marginBottom: 10, resize: 'vertical' }} />
                <button className="btn btn-primary" onClick={submitTrain}>Save Session</button>
              </motion.div>
            )}
          </AnimatePresence>
          {trainingSessions.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(224,120,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', color: 'var(--clay)', fontWeight: 600 }}>{s.duration}m</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--cream)', fontWeight: 500 }}>{s.type}</div>
                {s.notes && <div style={{ fontSize: '0.62rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.notes}</div>}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--muted)', flexShrink: 0 }}>{s.date && formatAWST(new Date(s.date), 'dd MMM')}</div>
            </div>
          ))}
          {trainingSessions.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: '0.82rem' }}>No sessions logged yet</div>}
        </motion.div>
      )}
    </div>
  )
}
