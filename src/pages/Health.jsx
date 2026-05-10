import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Droplets, Dumbbell, Heart, Plus, ChevronDown } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'
import { dateAWST, formatAWST } from '../lib/time'
import { AreaChart, Area, BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts'

const MOODS = ['😞','😕','😐','🙂','😊','😄']
const WORKOUTS = ['Run','Gym','Football','Basketball','Swimming','Cycling','HIIT','Yoga','Walk','Other']

function Ring({ value, max, color, size = 80, stroke = 7 }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(1, value / max)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }} />
    </svg>
  )
}

export default function Health() {
  const { sleepLogs, waterLogs, workoutLogs, moodLogs, bodyMetrics,
    addSleepLog, addWaterLog, addWorkoutLog, addMoodLog, addBodyMetric } = useLocalStore()
  const { addToast } = useUIStore()
  const today = dateAWST()

  const [activeTab, setActiveTab] = useState('sleep')
  const [openForm, setOpenForm] = useState(true)
  const [sleepForm, setSleepForm] = useState({ date: today, hours: 8, quality: 7, bedtime: '22:30', wakeTime: '06:30' })
  const [waterForm, setWaterForm] = useState({ date: today, ml: 250 })
  const [workoutForm, setWorkoutForm] = useState({ date: today, type: 'Gym', duration: 60, notes: '' })
  const [moodForm, setMoodForm] = useState({ date: today, mood: 4, energy: 4, notes: '' })
  const [metricForm, setMetricForm] = useState({ date: today, weight: '', notes: '' })

  const todayWater = waterLogs.filter(w => w.date === today).reduce((s, w) => s + parseFloat(w.ml || 0), 0)
  const waterGoal = 2500
  const todaySleep = sleepLogs.find(s => s.date === today)
  const todayMood = moodLogs.find(m => m.date === today)
  const weekWorkouts = workoutLogs.filter(w => { const d = new Date(w.date); return (Date.now() - d) / 86400000 <= 7 }).length

  const last7Sleep = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const k = d.toISOString().split('T')[0]
    const log = sleepLogs.find(l => l.date === k)
    return { day: d.toLocaleDateString('en-AU', { weekday: 'narrow' }), hours: parseFloat(log?.hours || 0) }
  })
  const last7Mood = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const k = d.toISOString().split('T')[0]
    const log = moodLogs.find(l => l.date === k)
    return { day: d.toLocaleDateString('en-AU', { weekday: 'narrow' }), mood: parseFloat(log?.mood || 0) }
  })

  const tabs = [
    { k: 'sleep', label: 'Sleep', icon: Moon, color: 'var(--dusk)' },
    { k: 'water', label: 'Water', icon: Droplets, color: 'var(--teal)' },
    { k: 'workout', label: 'Workout', icon: Dumbbell, color: 'var(--clay)' },
    { k: 'mood', label: 'Mood', icon: Heart, color: 'var(--rose)' },
    { k: 'body', label: 'Body', icon: null, color: 'var(--sage)' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Health <em style={{ fontStyle: 'italic', color: 'var(--sand)' }}>&amp; Wellness</em></h1>
        <p className="page-subtitle">Sleep, hydration, exercise &amp; mood tracking</p>
      </div>

      {/* Daily goal rings */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Sleep', value: parseFloat(todaySleep?.hours || 0), max: 9, color: 'var(--dusk)', unit: 'h', sub: todaySleep ? `Quality ${todaySleep.quality}/10` : 'Not logged' },
            { label: 'Water', value: todayWater / 100, max: 25, color: 'var(--teal)', unit: `${(todayWater/1000).toFixed(1)}L`, sub: `Goal: 2.5L` },
            { label: 'Workouts', value: weekWorkouts, max: 5, color: 'var(--clay)', unit: `${weekWorkouts}`, sub: 'This week' },
            { label: 'Mood', value: todayMood?.mood || 0, max: 6, color: 'var(--rose)', unit: todayMood ? MOODS[todayMood.mood - 1] : '—', sub: todayMood ? `Energy ${todayMood.energy}/10` : 'Not logged' },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Ring value={item.value} max={item.max} color={item.color} size={90} stroke={7} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: item.label === 'Mood' ? '1.4rem' : '1.1rem', color: item.color, fontWeight: 600, lineHeight: 1 }}>
                    {item.unit}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--cream)', fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{item.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass" style={{ padding: 24 }}>
          <div className="section-header"><span className="section-title">Sleep · Last 7 Days</span></div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={last7Sleep} barCategoryGap="30%">
              <XAxis dataKey="day" tick={{ fill: 'rgba(242,237,228,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--ink3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="hours" fill="var(--dusk)" radius={[4, 4, 0, 0]} name="Hours" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
            {last7Sleep.map((d, i) => (
              <div key={i} title={`${d.hours}h`} style={{ width: 6, height: 6, borderRadius: '50%', background: d.hours >= 8 ? 'var(--sage)' : d.hours >= 6 ? 'var(--amber)' : d.hours > 0 ? 'var(--rose)' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass" style={{ padding: 24 }}>
          <div className="section-header"><span className="section-title">Mood · Last 7 Days</span></div>
          <ResponsiveContainer width="100%" height={110}>
            <AreaChart data={last7Mood}>
              <defs>
                <linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--rose)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--rose)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'rgba(242,237,228,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--ink3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="mood" stroke="var(--rose)" strokeWidth={2} fill="url(#mGrad)" dot={{ fill: 'var(--rose)', r: 3 }} name="Mood" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8, fontSize: '0.8rem' }}>
            {last7Mood.map((d, i) => (
              <span key={i} style={{ opacity: d.mood > 0 ? 1 : 0.2 }}>{MOODS[(d.mood - 1)] || '—'}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Log panels */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass" style={{ padding: 24 }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.k} onClick={() => { setActiveTab(t.k); setOpenForm(true) }} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.65rem', padding: '7px 14px', borderRadius: 99, border: '1px solid',
              letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.15s',
              borderColor: activeTab === t.k ? t.color : 'var(--border)',
              background: activeTab === t.k ? `${t.color}18` : 'transparent',
              color: activeTab === t.k ? t.color : 'var(--muted)',
            }}>
              {t.icon && <t.icon size={11} />}
              {t.label}
            </button>
          ))}
        </div>

        {/* Sleep */}
        {activeTab === 'sleep' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date</label>
                <input type="date" className="input-base" value={sleepForm.date} onChange={e => setSleepForm({ ...sleepForm, date: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hours</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min={0} max={12} step={0.5} value={sleepForm.hours} onChange={e => setSleepForm({ ...sleepForm, hours: +e.target.value })} style={{ flex: 1, accentColor: 'var(--dusk)' }} />
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--dusk)', minWidth: 36 }}>{sleepForm.hours}h</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Quality (1–10)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min={1} max={10} value={sleepForm.quality} onChange={e => setSleepForm({ ...sleepForm, quality: +e.target.value })} style={{ flex: 1, accentColor: 'var(--dusk)' }} />
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--dusk)', minWidth: 20 }}>{sleepForm.quality}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bed</label>
                  <input type="time" className="input-base" value={sleepForm.bedtime} onChange={e => setSleepForm({ ...sleepForm, bedtime: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Wake</label>
                  <input type="time" className="input-base" value={sleepForm.wakeTime} onChange={e => setSleepForm({ ...sleepForm, wakeTime: e.target.value })} />
                </div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => { addSleepLog(sleepForm); addToast('Sleep logged', 'success') }}>
              <Moon size={13} /> Log Sleep
            </button>
            <div style={{ marginTop: 20 }}>
              {sleepLogs.slice(0, 5).map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(155,143,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', color: 'var(--dusk)', fontWeight: 600 }}>{l.hours}h</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--cream)', fontWeight: 500 }}>{l.bedtime} → {l.wakeTime}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>Quality {l.quality}/10 · {l.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Water */}
        {activeTab === 'water' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Today's intake</span>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: 'var(--teal)' }}>
                  {(todayWater / 1000).toFixed(1)}<span style={{ fontSize: '0.8rem', marginLeft: 2 }}>L</span>
                </span>
              </div>
              <div className="progress-track" style={{ height: 8, borderRadius: 99 }}>
                <div className="progress-fill" style={{ width: `${Math.min(100, (todayWater / waterGoal) * 100)}%`, background: 'linear-gradient(90deg, var(--teal), var(--dusk))', borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 4 }}>{Math.round((todayWater / waterGoal) * 100)}% of {waterGoal}ml goal</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[150, 250, 350, 500, 750].map(ml => (
                <button key={ml} onClick={() => { addWaterLog({ date: today, ml }); addToast(`+${ml}ml`, 'success') }}
                  style={{ padding: '8px 16px', borderRadius: 99, border: '1px solid rgba(78,201,184,0.3)', background: 'rgba(78,201,184,0.08)', color: 'var(--teal)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.15s' }}>
                  +{ml}ml
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" className="input-base" placeholder="Custom ml" value={waterForm.ml} onChange={e => setWaterForm({ ...waterForm, ml: +e.target.value })} />
              <button className="btn btn-primary" onClick={() => { addWaterLog(waterForm); addToast(`+${waterForm.ml}ml`, 'success') }}>Log</button>
            </div>
          </div>
        )}

        {/* Workout */}
        {activeTab === 'workout' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Type</label>
                <select className="input-base" value={workoutForm.type} onChange={e => setWorkoutForm({ ...workoutForm, type: e.target.value })}>
                  {WORKOUTS.map(w => <option key={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Duration</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min={10} max={180} step={5} value={workoutForm.duration} onChange={e => setWorkoutForm({ ...workoutForm, duration: +e.target.value })} style={{ flex: 1, accentColor: 'var(--clay)' }} />
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: 'var(--clay)', minWidth: 40 }}>{workoutForm.duration}m</span>
                </div>
              </div>
              <input type="date" className="input-base" value={workoutForm.date} onChange={e => setWorkoutForm({ ...workoutForm, date: e.target.value })} />
              <textarea className="input-base" placeholder="Notes" rows={2} value={workoutForm.notes} onChange={e => setWorkoutForm({ ...workoutForm, notes: e.target.value })} style={{ resize: 'vertical' }} />
            </div>
            <button className="btn btn-primary" onClick={() => { addWorkoutLog(workoutForm); addToast('Workout logged', 'success') }}>
              <Dumbbell size={13} /> Log Workout
            </button>
            <div style={{ marginTop: 20 }}>
              {workoutLogs.slice(0, 6).map(w => (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(224,120,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem', color: 'var(--clay)', fontWeight: 600 }}>{w.duration}m</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--cream)', fontWeight: 500 }}>{w.type}</div>
                    {w.notes && <div style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>{w.notes}</div>}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>{w.date}</div>
                </div>
              ))}
              {workoutLogs.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0', fontSize: '0.78rem' }}>No workouts logged yet</div>}
            </div>
          </div>
        )}

        {/* Mood */}
        {activeTab === 'mood' && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>How are you feeling?</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {MOODS.map((m, i) => (
                  <button key={i} onClick={() => setMoodForm({ ...moodForm, mood: i + 1 })}
                    style={{ fontSize: '1.6rem', padding: '10px', borderRadius: 12, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', flex: 1,
                      borderColor: moodForm.mood === i + 1 ? 'var(--rose)' : 'var(--border)',
                      background: moodForm.mood === i + 1 ? 'rgba(232,96,122,0.15)' : 'rgba(255,255,255,0.03)',
                      transform: moodForm.mood === i + 1 ? 'scale(1.1)' : 'scale(1)',
                    }}>{m}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: 6 }}>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Energy</span>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: 'var(--amber)' }}>{moodForm.energy}/10</span>
              </div>
              <input type="range" min={1} max={10} value={moodForm.energy} onChange={e => setMoodForm({ ...moodForm, energy: +e.target.value })} style={{ width: '100%', accentColor: 'var(--amber)' }} />
            </div>
            <textarea className="input-base" placeholder="Any notes about today?" rows={3} value={moodForm.notes} onChange={e => setMoodForm({ ...moodForm, notes: e.target.value })} style={{ marginBottom: 12, resize: 'vertical' }} />
            <button className="btn btn-primary" onClick={() => { addMoodLog({ ...moodForm, date: today }); addToast('Mood logged', 'success') }}>
              <Heart size={13} /> Log Mood
            </button>
          </div>
        )}

        {/* Body */}
        {activeTab === 'body' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Weight (kg)</label>
                <input type="number" className="input-base" step="0.1" value={metricForm.weight} onChange={e => setMetricForm({ ...metricForm, weight: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date</label>
                <input type="date" className="input-base" value={metricForm.date} onChange={e => setMetricForm({ ...metricForm, date: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => { if (metricForm.weight) { addBodyMetric(metricForm); addToast('Logged', 'success') } }}>Log Weight</button>
            <div style={{ marginTop: 20 }}>
              {bodyMetrics.slice(0, 8).map((m, i) => {
                const prev = bodyMetrics[i + 1]
                const diff = prev ? (parseFloat(m.weight) - parseFloat(prev.weight)).toFixed(1) : null
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--cream)' }}>{m.weight}<span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginLeft: 2 }}>kg</span></span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {diff && <span style={{ fontSize: '0.68rem', color: parseFloat(diff) > 0 ? 'var(--rose)' : 'var(--sage)' }}>{parseFloat(diff) > 0 ? '+' : ''}{diff}</span>}
                      <span style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>{m.date}</span>
                    </div>
                  </div>
                )
              })}
              {bodyMetrics.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0', fontSize: '0.78rem' }}>No metrics logged yet</div>}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
