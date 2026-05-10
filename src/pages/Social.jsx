import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Heart, Star, Calendar, Users } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'
import { formatAWST, dateAWST } from '../lib/time'
import { differenceInDays } from 'date-fns'

const TYPE_EMOJI = { Birthday: '🎂', Anniversary: '💍', Event: '🎉', Reminder: '🔔', Other: '📌' }
const GRAT_CATS = ['Person', 'Experience', 'Achievement', 'Thing', 'Moment']

export default function Social() {
  const { contacts, addContact, updateContact, socialEvents, addSocialEvent, gratitudeEntries, addGratitude } = useLocalStore()
  const { addToast } = useUIStore()
  const [tab, setTab] = useState('contacts')
  const [contactForm, setContactForm] = useState({ name: '', relationship: '', birthday: '', notes: '', lastContact: '' })
  const [eventForm, setEventForm] = useState({ title: '', date: '', type: 'Birthday', notes: '' })
  const [gratForm, setGratForm] = useState({ text: '', category: 'Person' })

  const today = dateAWST()
  const upcomingDates = socialEvents.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))

  function submitContact() {
    if (!contactForm.name) return
    addContact(contactForm)
    addToast('Contact added', 'success')
    setContactForm({ name: '', relationship: '', birthday: '', notes: '', lastContact: '' })
  }

  function submitEvent() {
    if (!eventForm.title || !eventForm.date) return
    addSocialEvent(eventForm)
    addToast('Date added', 'success')
    setEventForm({ title: '', date: '', type: 'Birthday', notes: '' })
  }

  function submitGrat() {
    if (!gratForm.text) return
    addGratitude(gratForm)
    addToast('Gratitude logged ✦', 'success')
    setGratForm({ text: '', category: 'Person' })
  }

  const RELATIONSHIP_COLORS = {
    friend: 'var(--rose)', family: 'var(--amber)', partner: 'var(--dusk)',
    colleague: 'var(--teal)', mentor: 'var(--sage)', other: 'var(--muted)',
  }

  function getRelColor(rel) {
    const k = rel?.toLowerCase() || ''
    for (const [key, val] of Object.entries(RELATIONSHIP_COLORS)) {
      if (k.includes(key)) return val
    }
    return 'var(--muted)'
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Social <em style={{ fontStyle: 'italic', color: 'var(--sand)' }}>&amp; Relationships</em></h1>
        <p className="page-subtitle">Contacts, important dates &amp; gratitude practice</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Contacts', value: contacts.length, color: 'var(--rose)', icon: Users },
          { label: 'Upcoming Dates', value: upcomingDates.length, color: 'var(--amber)', icon: Calendar },
          { label: 'Gratitude Entries', value: gratitudeEntries.length, color: 'var(--sage)', icon: Heart },
          { label: 'Social Events', value: socialEvents.length, color: 'var(--dusk)', icon: Star },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="glass stat-card" style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
              <s.icon size={18} color={s.color} style={{ opacity: 0.5 }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Upcoming dates strip */}
      {upcomingDates.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: '14px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, overflowX: 'auto', paddingBottom: 2 }}>
            <span style={{ fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.16em', flexShrink: 0 }}>Coming up</span>
            {upcomingDates.slice(0, 5).map(e => {
              const days = differenceInDays(new Date(e.date + 'T12:00:00'), new Date())
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: '1px solid var(--border)', flexShrink: 0 }}>
                  <span style={{ fontSize: '1rem' }}>{TYPE_EMOJI[e.type] || '📌'}</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--cream)', fontWeight: 500 }}>{e.title}</div>
                    <div style={{ fontSize: '0.58rem', color: days <= 3 ? 'var(--rose)' : 'var(--muted)' }}>
                      {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days}d`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[{ k: 'contacts', l: 'Contacts' }, { k: 'dates', l: 'Important Dates' }, { k: 'gratitude', l: 'Gratitude' }].map(({ k, l }) => (
          <button key={k} onClick={() => setTab(k)} style={{
            fontSize: '0.65rem', padding: '7px 18px', borderRadius: 99, border: '1px solid',
            textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
            borderColor: tab === k ? 'var(--rose)' : 'var(--border)',
            background: tab === k ? 'rgba(232,96,122,0.1)' : 'transparent',
            color: tab === k ? 'var(--rose)' : 'var(--muted)',
          }}>{l}</button>
        ))}
      </div>

      {/* Contacts */}
      {tab === 'contacts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-sm" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 12 }}>Add Contact</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <input className="input-base" placeholder="Name" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} />
              <input className="input-base" placeholder="Relationship" value={contactForm.relationship} onChange={e => setContactForm({ ...contactForm, relationship: e.target.value })} />
              <input type="date" className="input-base" placeholder="Birthday" value={contactForm.birthday} onChange={e => setContactForm({ ...contactForm, birthday: e.target.value })} />
              <input type="date" className="input-base" placeholder="Last contact" value={contactForm.lastContact} onChange={e => setContactForm({ ...contactForm, lastContact: e.target.value })} />
              <textarea className="input-base" placeholder="Notes, how you met, shared interests…" rows={2} value={contactForm.notes} onChange={e => setContactForm({ ...contactForm, notes: e.target.value })} style={{ gridColumn: '1/-1', resize: 'vertical' }} />
            </div>
            <button className="btn btn-primary" onClick={submitContact}><Plus size={14} /> Add Contact</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
            <AnimatePresence>
              {contacts.map(c => {
                const rc = getRelColor(c.relationship)
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="glass" style={{ padding: 20, borderLeft: `2px solid ${rc}30` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${rc}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: rc, fontWeight: 600 }}>
                          {c.name[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 600 }}>{c.name}</div>
                        {c.relationship && (
                          <div style={{ fontSize: '0.62rem', color: rc, textTransform: 'capitalize', fontWeight: 500 }}>{c.relationship}</div>
                        )}
                      </div>
                    </div>
                    {c.notes && <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.55, marginBottom: 10 }}>{c.notes}</div>}
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.62rem', color: 'var(--muted)' }}>
                      {c.birthday && <span>🎂 {formatAWST(new Date(c.birthday + 'T12:00:00'), 'dd MMM')}</span>}
                      {c.lastContact && <span>Last seen {formatAWST(new Date(c.lastContact + 'T12:00:00'), 'dd MMM')}</span>}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {contacts.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: '0.82rem' }}>
                No contacts yet. Add the people who matter to you.
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Important dates */}
      {tab === 'dates' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-sm" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <input className="input-base" placeholder="Title (e.g. Mum's birthday)" value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} />
              <select className="input-base" value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })}>
                {Object.keys(TYPE_EMOJI).map(t => <option key={t}>{t}</option>)}
              </select>
              <input type="date" className="input-base" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} />
              <input className="input-base" placeholder="Notes" value={eventForm.notes} onChange={e => setEventForm({ ...eventForm, notes: e.target.value })} />
            </div>
            <button className="btn btn-primary" onClick={submitEvent}><Plus size={14} /> Add Date</button>
          </div>

          <motion.div className="glass" style={{ padding: 24 }}>
            {socialEvents.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: '0.82rem' }}>No important dates yet</div>
            ) : socialEvents.sort((a, b) => a.date.localeCompare(b.date)).map(e => {
              const days = differenceInDays(new Date(e.date + 'T12:00:00'), new Date())
              const isPast = days < 0
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: '1px solid var(--border)', opacity: isPast ? 0.55 : 1 }}>
                  <div style={{ fontSize: '1.3rem', flexShrink: 0 }}>{TYPE_EMOJI[e.type] || '📌'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--cream)', fontWeight: 500 }}>{e.title}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--muted)', marginTop: 2 }}>
                      {e.date && formatAWST(new Date(e.date + 'T12:00:00'), 'EEE dd MMM yyyy')} · {e.type}
                    </div>
                    {e.notes && <div style={{ fontSize: '0.62rem', color: 'var(--muted)', marginTop: 2 }}>{e.notes}</div>}
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, flexShrink: 0,
                    color: days === 0 ? 'var(--amber)' : days > 0 && days <= 7 ? 'var(--rose)' : 'var(--muted)' }}>
                    {days === 0 ? 'Today!' : days > 0 ? `${days}d` : `${Math.abs(days)}d ago`}
                  </div>
                </div>
              )
            })}
          </motion.div>
        </motion.div>
      )}

      {/* Gratitude */}
      {tab === 'gratitude' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-sm" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: 16, fontStyle: 'italic' }}>
              What are you grateful for today?
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {GRAT_CATS.map(cat => (
                <button key={cat} onClick={() => setGratForm({ ...gratForm, category: cat })} style={{
                  fontSize: '0.62rem', padding: '5px 13px', borderRadius: 99, border: '1px solid', cursor: 'pointer',
                  borderColor: gratForm.category === cat ? 'var(--sage)' : 'var(--border)',
                  background: gratForm.category === cat ? 'rgba(109,191,138,0.15)' : 'transparent',
                  color: gratForm.category === cat ? 'var(--sage)' : 'var(--muted)',
                }}>{cat}</button>
              ))}
            </div>
            <textarea className="input-base" placeholder="I'm grateful for…" rows={3} value={gratForm.text} onChange={e => setGratForm({ ...gratForm, text: e.target.value })} style={{ marginBottom: 12, resize: 'vertical' }} />
            <button className="btn btn-primary" onClick={submitGrat}><Star size={13} /> Log Gratitude</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence>
              {gratitudeEntries.map((g, i) => (
                <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass" style={{ padding: '18px 22px', borderLeft: '3px solid var(--sage)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.86rem', color: 'var(--cream)', lineHeight: 1.6, marginBottom: 8 }}>{g.text}</div>
                      <span style={{ fontSize: '0.58rem', padding: '2px 9px', borderRadius: 99, background: 'rgba(109,191,138,0.1)', color: 'var(--sage)', border: '1px solid rgba(109,191,138,0.2)' }}>
                        {g.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)', flexShrink: 0, marginTop: 2, textAlign: 'right' }}>
                      {g.date && formatAWST(new Date(g.date), 'dd MMM')}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {gratitudeEntries.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: '0.82rem' }}>
                Start a gratitude practice — log what matters.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
