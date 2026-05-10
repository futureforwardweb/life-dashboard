import React, { useState, useEffect } from 'react'
import { timeAWST, formatAWST, nowAWST } from '../../lib/time'

export default function ClockWidget() {
  const [time, setTime] = useState(timeAWST())
  const [date, setDate] = useState(formatAWST(new Date(), 'EEE, dd MMM'))

  useEffect(() => {
    const tick = () => {
      setTime(timeAWST())
      setDate(formatAWST(nowAWST(), 'EEE, dd MMM'))
    }
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ padding:'0 20px 16px', marginBottom:'8px' }}>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'1.6rem', fontWeight:500, color:'var(--cream)', letterSpacing:'0.04em', lineHeight:1 }}>
        {time}
      </div>
      <div style={{ fontSize:'0.65rem', color:'var(--muted)', marginTop:3, letterSpacing:'0.1em' }}>
        {date} · AWST
      </div>
    </div>
  )
}
