import React from 'react'
import { Moon, Sunrise } from 'lucide-react'
import { useUIStore } from '../../store'

export default function ReflectionTrigger() {
  const { setShowDailyReflection, setShowWeeklyReflection } = useUIStore()
  return (
    <div style={{ padding:'0 12px 8px', display:'flex', flexDirection:'column', gap:4 }}>
      <button
        onClick={() => setShowDailyReflection(true)}
        className="sidebar-nav-item"
        style={{ width:'100%', background:'rgba(155,143,212,0.08)', border:'1px solid rgba(155,143,212,0.18)', borderRadius:10, cursor:'pointer' }}
      >
        <Moon size={15} color="var(--dusk)" style={{ flexShrink:0 }} />
        <span style={{ fontSize:'0.75rem', color:'var(--dusk)' }}>Daily Reflection</span>
      </button>
      <button
        onClick={() => setShowWeeklyReflection(true)}
        className="sidebar-nav-item"
        style={{ width:'100%', background:'rgba(224,120,74,0.08)', border:'1px solid rgba(224,120,74,0.18)', borderRadius:10, cursor:'pointer' }}
      >
        <Sunrise size={15} color="var(--clay)" style={{ flexShrink:0 }} />
        <span style={{ fontSize:'0.75rem', color:'var(--clay)' }}>Weekly Review</span>
      </button>
    </div>
  )
}
