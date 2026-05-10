import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sunrise } from 'lucide-react'
import { useUIStore, useLocalStore } from '../../store'
import { formatAWST } from '../../lib/time'

const PROMPTS = [
  { key:'wins',         label:'This week\'s wins',           placeholder:'3 things you\'re proud of this week…' },
  { key:'challenges',   label:'Biggest obstacles',           placeholder:'What got in the way and how did you cope?' },
  { key:'learned',      label:'Key lesson of the week',      placeholder:'What\'s the most important thing you learnt?' },
  { key:'academic',     label:'Academic progress',           placeholder:'How did your study and grades track this week?' },
  { key:'athletic',     label:'Athletic progress',           placeholder:'Training, games, personal bests…' },
  { key:'health',       label:'Health & wellness check',     placeholder:'Sleep, energy, mood — how were you this week?' },
  { key:'social',       label:'Relationships',               placeholder:'How were your connections with people this week?' },
  { key:'nextWeek',     label:'Focus for next week',         placeholder:'One clear intention for the week ahead…' },
  { key:'mood',         label:'Overall week rating (1-10)',  placeholder:'', type:'rating' },
]

export default function WeeklyReflectionModal() {
  const { setShowWeeklyReflection, addToast } = useUIStore()
  const { addWeeklyReflection } = useLocalStore()
  const [values, setValues] = useState({})
  const [step, setStep] = useState(0)
  const current = PROMPTS[step]
  const isLast = step === PROMPTS.length - 1

  function set_(key, val) { setValues((v) => ({ ...v, [key]: val })) }
  function getWeekKey() {
    const d = new Date()
    const start = new Date(d.setDate(d.getDate() - d.getDay()))
    return start.toISOString().split('T')[0]
  }

  function submit() {
    addWeeklyReflection({ ...values, weekOf: getWeekKey() })
    localStorage.setItem('calloway-last-weekly', getWeekKey())
    addToast('Weekly review saved ✦', 'success')
    setShowWeeklyReflection(false)
  }

  return (
    <div className="modal-overlay">
      <motion.div
        initial={{ opacity:0, scale:0.95, y:20 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.95, y:20 }}
        transition={{ type:'spring', stiffness:280, damping:22 }}
        className="glass modal"
        style={{ maxWidth:560 }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(224,120,74,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Sunrise size={18} color="var(--clay)" />
            </div>
            <div>
              <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.3rem', fontWeight:600, color:'var(--cream)' }}>Weekly Review</div>
              <div style={{ fontSize:'0.65rem', color:'var(--muted)', letterSpacing:'0.1em' }}>Week of {formatAWST(new Date(), 'dd MMM yyyy')}</div>
            </div>
          </div>
          <button onClick={() => setShowWeeklyReflection(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display:'flex', gap:3, marginBottom:28 }}>
          {PROMPTS.map((_,i) => (
            <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i <= step ? 'var(--clay)' : 'var(--border)', transition:'background 0.3s' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.22 }}>
            <div style={{ fontSize:'0.65rem', color:'var(--clay)', letterSpacing:'0.16em', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>
              {step + 1} of {PROMPTS.length}
            </div>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.4rem', fontWeight:400, color:'var(--cream)', marginBottom:20, lineHeight:1.3 }}>
              {current.label}
            </div>
            {current.type === 'rating' ? (
              <div style={{ display:'flex', gap:8 }}>
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <button key={n} onClick={() => set_(current.key, n)} style={{
                    flex:1, aspectRatio:'1', borderRadius:8, border:'1px solid',
                    borderColor: values[current.key] === n ? 'var(--clay)' : 'var(--border)',
                    background: values[current.key] === n ? 'rgba(224,120,74,0.2)' : 'rgba(255,255,255,0.03)',
                    color: values[current.key] === n ? 'var(--clay)' : 'var(--muted)',
                    cursor:'pointer', fontSize:'0.82rem', fontWeight:600, transition:'all 0.15s'
                  }}>{n}</button>
                ))}
              </div>
            ) : (
              <textarea className="input-base" rows={5} placeholder={current.placeholder} value={values[current.key] || ''} onChange={(e) => set_(current.key, e.target.value)} style={{ resize:'vertical' }} />
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ display:'flex', gap:10, marginTop:28 }}>
          {step > 0 && <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setStep((s) => s - 1)}>Back</button>}
          <button className="btn btn-primary" style={{ flex:2, background:'linear-gradient(135deg, var(--clay), var(--amber))' }} onClick={() => isLast ? submit() : setStep((s) => s + 1)}>
            {isLast ? 'Save Review ✦' : 'Continue →'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
