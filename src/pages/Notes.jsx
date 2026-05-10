import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit3, ExternalLink, Cloud, Link2 } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'
import { formatAWST } from '../lib/time'

function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY

  useEffect(() => {
    if (!apiKey || apiKey === 'your_openweather_api_key') { setLoading(false); return }
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=Perth,AU&appid=${apiKey}&units=metric`)
      .then(r => r.json())
      .then(d => { setWeather(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const icons = { Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️', Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️' }

  return (
    <div className="glass" style={{ padding: 28 }}>
      <div className="section-header">
        <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Cloud size={13} /> Perth Weather
        </span>
      </div>
      {loading ? (
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', padding: '8px 0' }}>Fetching weather…</div>
      ) : !apiKey || apiKey === 'your_openweather_api_key' ? (
        <div>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌤️</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: 14 }}>
            Weather is ready — just add your API key to enable live data.
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'var(--sand)', lineHeight: 1.8 }}>
            1. Get free key: openweathermap.org<br />
            2. Add to .env.local:<br />
            VITE_OPENWEATHER_API_KEY=your_key
          </div>
        </div>
      ) : weather?.main ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
            <div style={{ fontSize: '3.2rem' }}>{icons[weather.weather?.[0]?.main] || '🌤️'}</div>
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.8rem', color: 'var(--cream)', lineHeight: 1 }}>
                {Math.round(weather.main.temp)}°
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'capitalize', marginTop: 2 }}>{weather.weather?.[0]?.description}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: '0.68rem', color: 'var(--muted)' }}>
            <div><div style={{ fontWeight: 600, color: 'var(--cream)' }}>Feels {Math.round(weather.main.feels_like)}°</div></div>
            <div><div style={{ fontWeight: 600, color: 'var(--cream)' }}>{weather.main.humidity}%</div><div>Humidity</div></div>
            <div><div style={{ fontWeight: 600, color: 'var(--cream)' }}>{Math.round((weather.wind?.speed || 0) * 3.6)} km/h</div><div>Wind</div></div>
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--rose)', fontSize: '0.78rem' }}>Couldn't load weather. Check your API key.</div>
      )}
    </div>
  )
}

export default function Notes() {
  const { notes, addNote, updateNote, deleteNote, bookmarks, addBookmark, deleteBookmark, quickLinks, addQuickLink, deleteQuickLink } = useLocalStore()
  const { addToast } = useUIStore()
  const [tab, setTab] = useState('notes')
  const [editingId, setEditingId] = useState(null)
  const [noteForm, setNoteForm] = useState({ title: '', content: '', color: 'default', tags: '' })
  const [bookmarkForm, setBookmarkForm] = useState({ title: '', url: '', category: 'General', notes: '' })
  const [linkForm, setLinkForm] = useState({ label: '', url: '', icon: '🔗' })

  const NOTE_COLORS = {
    default: { bg: 'rgba(255,255,255,0.04)', border: 'var(--border)', accent: 'var(--muted)' },
    dusk:    { bg: 'rgba(155,143,212,0.1)',   border: 'rgba(155,143,212,0.25)', accent: 'var(--dusk)' },
    clay:    { bg: 'rgba(224,120,74,0.1)',    border: 'rgba(224,120,74,0.25)',  accent: 'var(--clay)' },
    sage:    { bg: 'rgba(109,191,138,0.1)',   border: 'rgba(109,191,138,0.25)', accent: 'var(--sage)' },
    rose:    { bg: 'rgba(232,96,122,0.1)',    border: 'rgba(232,96,122,0.25)',  accent: 'var(--rose)' },
    amber:   { bg: 'rgba(240,162,74,0.1)',    border: 'rgba(240,162,74,0.25)',  accent: 'var(--amber)' },
  }

  function submitNote() {
    if (!noteForm.content) return
    if (editingId) {
      updateNote(editingId, { ...noteForm, updatedAt: new Date().toISOString() })
      addToast('Note updated', 'success')
      setEditingId(null)
    } else {
      addNote(noteForm)
      addToast('Note saved', 'success')
    }
    setNoteForm({ title: '', content: '', color: 'default', tags: '' })
  }

  function startEdit(n) {
    setEditingId(n.id)
    setNoteForm({ title: n.title || '', content: n.content || '', color: n.color || 'default', tags: n.tags || '' })
    setTab('notes')
  }

  function submitBookmark() {
    if (!bookmarkForm.url || !bookmarkForm.title) return
    addBookmark(bookmarkForm)
    addToast('Bookmark saved', 'success')
    setBookmarkForm({ title: '', url: '', category: 'General', notes: '' })
  }

  function submitLink() {
    if (!linkForm.label || !linkForm.url) return
    addQuickLink(linkForm)
    addToast('Quick link added', 'success')
    setLinkForm({ label: '', url: '', icon: '🔗' })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notes <em style={{ fontStyle: 'italic', color: 'var(--sand)' }}>&amp; Links</em></h1>
        <p className="page-subtitle">Notes, bookmarks, quick links &amp; weather</p>
      </div>

      {/* Quick links launcher */}
      {quickLinks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: '14px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.56rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.18em', flexShrink: 0 }}>Quick Launch</span>
            {quickLinks.map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 9, textDecoration: 'none', color: 'var(--cream)', fontSize: '0.75rem', fontWeight: 500, transition: 'all 0.15s' }}>
                <span>{l.icon}</span>{l.label}
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
        {[
          { k: 'notes', l: 'Notes' },
          { k: 'bookmarks', l: 'Bookmarks' },
          { k: 'links', l: 'Quick Links' },
          { k: 'weather', l: 'Weather' },
        ].map(({ k, l }) => (
          <button key={k} onClick={() => setTab(k)} style={{
            fontSize: '0.65rem', padding: '7px 18px', borderRadius: 99, border: '1px solid',
            textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
            borderColor: tab === k ? 'var(--dusk)' : 'var(--border)',
            background: tab === k ? 'rgba(155,143,212,0.15)' : 'transparent',
            color: tab === k ? 'var(--dusk)' : 'var(--muted)',
          }}>{l}</button>
        ))}
      </div>

      {/* Notes */}
      {tab === 'notes' && (
        <div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: 24, marginBottom: 20 }}>
            {editingId && (
              <div style={{ fontSize: '0.62rem', color: 'var(--dusk)', marginBottom: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>✎ Editing note</div>
            )}
            <input className="input-base" placeholder="Title (optional)" value={noteForm.title} onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} style={{ marginBottom: 10 }} />
            <textarea className="input-base" placeholder="Write anything…" rows={4} value={noteForm.content} onChange={e => setNoteForm({ ...noteForm, content: e.target.value })} style={{ marginBottom: 10, resize: 'vertical' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Color</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.entries(NOTE_COLORS).map(([k, v]) => (
                  <button key={k} onClick={() => setNoteForm({ ...noteForm, color: k })}
                    style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${noteForm.color === k ? v.accent : 'transparent'}`, background: v.accent, cursor: 'pointer', padding: 0, transition: 'all 0.15s', transform: noteForm.color === k ? 'scale(1.25)' : 'scale(1)' }} />
                ))}
              </div>
              <input className="input-base" placeholder="Tags (comma separated)" value={noteForm.tags} onChange={e => setNoteForm({ ...noteForm, tags: e.target.value })} style={{ flex: 1, padding: '6px 12px', fontSize: '0.72rem' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={submitNote} style={{ flex: 1 }}>
                {editingId ? 'Update Note' : 'Save Note'}
              </button>
              {editingId && (
                <button className="btn btn-ghost" onClick={() => { setEditingId(null); setNoteForm({ title: '', content: '', color: 'default', tags: '' }) }}>Cancel</button>
              )}
            </div>
          </motion.div>

          <div style={{ columns: '280px', gap: 14 }}>
            <AnimatePresence>
              {notes.map(n => {
                const c = NOTE_COLORS[n.color] || NOTE_COLORS.default
                return (
                  <motion.div key={n.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, marginBottom: 14, breakInside: 'avoid' }}>
                    {n.title && <div style={{ fontSize: '0.88rem', color: 'var(--cream)', fontWeight: 600, marginBottom: 8 }}>{n.title}</div>}
                    <div style={{ fontSize: '0.82rem', color: 'rgba(242,237,228,0.7)', lineHeight: 1.65, whiteSpace: 'pre-wrap', marginBottom: 12 }}>{n.content}</div>
                    {n.tags && (
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                        {n.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                          <span key={t} style={{ fontSize: '0.56rem', padding: '2px 8px', borderRadius: 99, background: `${c.accent}18`, color: c.accent, border: `1px solid ${c.accent}20` }}>#{t}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.56rem', color: 'var(--muted)' }}>{formatAWST(new Date(n.updatedAt || n.createdAt), 'dd MMM · HH:mm')}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => startEdit(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.accent, opacity: 0.7 }}><Edit3 size={13} /></button>
                        <button onClick={() => { deleteNote(n.id); addToast('Note deleted', 'success') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.5 }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {notes.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px 0', fontSize: '0.82rem' }}>No notes yet — write something.</div>
            )}
          </div>
        </div>
      )}

      {/* Bookmarks */}
      {tab === 'bookmarks' && (
        <div>
          <div className="glass-sm" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <input className="input-base" placeholder="Title" value={bookmarkForm.title} onChange={e => setBookmarkForm({ ...bookmarkForm, title: e.target.value })} />
              <input className="input-base" placeholder="URL (https://…)" value={bookmarkForm.url} onChange={e => setBookmarkForm({ ...bookmarkForm, url: e.target.value })} />
              <select className="input-base" value={bookmarkForm.category} onChange={e => setBookmarkForm({ ...bookmarkForm, category: e.target.value })}>
                {['General', 'Study', 'Sport', 'Finance', 'Reading', 'Tools', 'Entertainment'].map(c => <option key={c}>{c}</option>)}
              </select>
              <input className="input-base" placeholder="Notes (optional)" value={bookmarkForm.notes} onChange={e => setBookmarkForm({ ...bookmarkForm, notes: e.target.value })} />
            </div>
            <button className="btn btn-primary" onClick={submitBookmark}><Plus size={14} /> Save Bookmark</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {bookmarks.map(b => (
              <div key={b.id} className="glass" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--cream)' }}>{b.title}</div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--dusk)', display: 'flex' }}><ExternalLink size={14} /></a>
                    <button onClick={() => { deleteBookmark(b.id); addToast('Deleted', 'success') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.5, padding: 0 }}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.url}</div>
                {b.notes && <div style={{ fontSize: '0.68rem', color: 'var(--muted)', lineHeight: 1.5 }}>{b.notes}</div>}
                <span style={{ fontSize: '0.56rem', padding: '2px 9px', borderRadius: 99, background: 'rgba(155,143,212,0.1)', color: 'var(--dusk)', border: '1px solid rgba(155,143,212,0.2)', alignSelf: 'flex-start' }}>
                  {b.category}
                </span>
              </div>
            ))}
            {bookmarks.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--muted)', padding: '48px 0', fontSize: '0.82rem' }}>No bookmarks saved yet</div>
            )}
          </div>
        </div>
      )}

      {/* Quick Links */}
      {tab === 'links' && (
        <div>
          <div className="glass-sm" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, marginBottom: 8 }}>
              <input className="input-base" placeholder="🔗" value={linkForm.icon} onChange={e => setLinkForm({ ...linkForm, icon: e.target.value })} />
              <input className="input-base" placeholder="Label (e.g. School Portal)" value={linkForm.label} onChange={e => setLinkForm({ ...linkForm, label: e.target.value })} />
              <input className="input-base" placeholder="URL (https://…)" value={linkForm.url} onChange={e => setLinkForm({ ...linkForm, url: e.target.value })} style={{ gridColumn: '1/-1' }} />
            </div>
            <button className="btn btn-primary" onClick={submitLink}><Plus size={14} /> Add Link</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {quickLinks.map(l => (
              <div key={l.id} style={{ position: 'relative' }}>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="glass"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '22px 16px', textDecoration: 'none', borderRadius: 16, transition: 'transform 0.15s' }}>
                  <span style={{ fontSize: '2.2rem' }}>{l.icon}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--cream)', fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>{l.label}</span>
                </a>
                <button onClick={() => { deleteQuickLink(l.id); addToast('Removed', 'success') }}
                  style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', borderRadius: '50%', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                  ✕
                </button>
              </div>
            ))}
            {quickLinks.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--muted)', padding: '48px 0', fontSize: '0.82rem' }}>No quick links yet</div>
            )}
          </div>
        </div>
      )}

      {/* Weather */}
      {tab === 'weather' && (
        <div className="grid-2">
          <WeatherWidget />
          <div className="glass" style={{ padding: 28 }}>
            <div className="section-header"><span className="section-title">Perth, WA · AWST</span></div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.8, marginBottom: 16 }}>
              Live weather from OpenWeatherMap for Perth, Western Australia.
            </p>
            <div style={{ background: 'rgba(155,143,212,0.06)', border: '1px solid rgba(155,143,212,0.15)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--dusk)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 8 }}>Setup</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'var(--sand)', lineHeight: 2 }}>
                VITE_OPENWEATHER_API_KEY=your_key
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 8 }}>Add to <code style={{ color: 'var(--cream)' }}>.env.local</code> and restart the dev server.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
