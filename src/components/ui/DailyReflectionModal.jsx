import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Moon, Star } from 'lucide-react'
import { useUIStore, useLocalStore } from '../../store'
import { dateAWST, formatAWST } from '../../lib/time'

const PROMPTS = [
  { key:'highlight',    label:'Best moment of the day', placeholder:'What went really well today?' },
  { key:'challenge',    label:'Biggest challenge',      placeholder:'What was hard, and how did you handle it?' },
  { key:'learned',      label:'What I learned',         placeholder:'One thing you learned or realised today…' },
  { key:'grateful',     label:'Grateful for',           placeholder:'3 things you\'re grateful for today…' },
  { key:'tomorrow',     label:'Tomorrow\'s intention',  placeholder:'One thing you want to focus on tomorrow…' },
  { key:'mood',         label:'Overall mood (1-10)',     placeholder:'', type:'rating' },
  { key:'energy',       label:'Energy level (1-10)',     placeholder:'', type:'rating' },
]

export default function DailyReflectionModal() {
  const { setShowDailyReflection, addToast } = useUIStore()
  const { addDailyReflection } = useLocalStore()
  const [values, setValues] = useState({})
  const [step, setStep] = useState(0)

  const current = PROMPTS[step]
  const isLast = step === PROMPTS.length - 1

  function set_(key, val) { setValues((v) => ({ ...v, [key]: val })) }

  function next() {
    if (isLast) return submit()
    setStep((s) => s + 1)
  }

  function submit() {
    addDailyReflection({ ...values, date: dateAWST() })
    localStorage.setItem('calloway-last-daily', dateAWST())
    addToast('Daily reflection saved ✦', 'success')
    setShowDailyReflection(false)
  }

  return (
    <div className="modal-overlay">
      <motion.div
        initial={{ opacity:0, scale:0.95, y:20 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.95, y:20 }}
        transition={{ type:'spring', stiffness:280, damping:22 }}
        className="glass modal"
        style={{ maxWidth:520 }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(155,143,212,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Moon size={18} color="var(--dusk)" />
            </div>
            <div>
              <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.3rem', fontWeight:600, color:'var(--cream)' }}>Daily Reflection</div>
              <div style={{ fontSize:'0.65rem', color:'var(--muted)', letterSpacing:'0.1em' }}>{formatAWST(new Date(), 'EEEE, dd MMMM yyyy')} · AWST</div>
            </div>
          </div>
          <button onClick={() => setShowDailyReflection(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Progress */}
        <div style={{ display:'flex', gap:4, marginBottom:28 }}>
          {PROMPTS.map((_, i) => (
            <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i <= step ? 'var(--dusk)' : 'var(--border)', transition:'background 0.3s' }} />
          ))}
        </div>

        {/* Prompt */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity:0, x:20 }}
            animate={{ opacity:1, x:0 }}
            exit={{ opacity:0, x:-20 }}
            transition={{ duration:0.22 }}
          >
            <div style={{ fontSize:'0.65rem', color:'var(--dusk)', letterSpacing:'0.16em', textTransform:'uppercase', fontWeight:600, marginBottom:8 }}>
              {step + 1} of {PROMPTS.length}
            </div>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.4rem', fontWeight:400, color:'var(--cream)', marginBottom:20, lineHeight:1.3 }}>
              {current.label}
            </div>

            {current.type === 'rating' ? (
              <div style={{ display:'flex', gap:8 }}>
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <button
                    key={n}
                    onClick={() => set_(current.key, n)}
                    style={{
                      flex:1, aspectRatio:'1', borderRadius:8, border:'1px solid',
                      borderColor: values[current.key] === n ? 'var(--dusk)' : 'var(--border)',
                      background: values[current.key] === n ? 'rgba(155,143,212,0.2)' : 'rgba(255,255,255,0.03)',
                      color: values[current.key] === n ? 'var(--dusk)' : 'var(--muted)',
                      cursor:'pointer', fontSize:'0.82rem', fontWeight:600,
                      transition:'all 0.15s'
                    }}
                  >{n}</button>
                ))}
              </div>
            ) : (
              <textarea
                className="input-base"
                rows={4}
                placeholder={current.placeholder}
                value={values[current.key] || ''}
                onChange={(e) => set_(current.key, e.target.value)}
                style={{ resize:'vertical' }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        <div style={{ display:'flex', gap:10, marginTop:28 }}>
          {step > 0 && (
            <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          <button className="btn btn-primary" style={{ flex:2 }} onClick={next}>
            {isLast ? 'Save Reflection ✦' : 'Continue →'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
