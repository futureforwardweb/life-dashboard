import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Bookmark, ExternalLink, Search, Tag } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'

export default function Bookmarks() {
  const { bookmarks, addBookmark, deleteBookmark } = useLocalStore()
  const { addToast } = useUIStore()
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [form, setForm] = useState({ title: '', url: '', description: '', tag: '' })

  const tags = useMemo(() => [...new Set(bookmarks.map(b => b.tag).filter(Boolean))], [bookmarks])
  const filtered = bookmarks.filter(b => {
    if (filterTag && b.tag !== filterTag) return false
    if (query && !`${b.title} ${b.description} ${b.url}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  function submit() {
    if (!form.title || !form.url) return
    let url = form.url
    if (!/^https?:\/\//.test(url)) url = `https://${url}`
    addBookmark({ ...form, url })
    addToast('Bookmark saved', 'success')
    setAdding(false)
    setForm({ title: '', url: '', description: '', tag: '' })
  }

  function getDomain(url) {
    try { return new URL(url).hostname.replace('www.', '') } catch { return url }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bookmarks</h1>
        <p className="page-subtitle">Saved links · references · resources</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)' }} />
          <input className="input-base" placeholder="Search bookmarks…" value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        {tags.length > 0 && (
          <select className="input-base" value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{ width: 'auto', minWidth: 140 }}>
            <option value="">All tags</option>
            {tags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
        <button className="btn btn-primary" onClick={() => setAdding(v => !v)}>
          <Plus size={13} /> {adding ? 'Cancel' : 'Add Bookmark'}
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass" style={{ padding: 24, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <input className="input-base" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <input className="input-base" placeholder="URL (https://…)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
              <input className="input-base" placeholder="Tag (optional)" value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} />
              <input className="input-base" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn btn-primary" onClick={submit}>Save</button>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <div className="glass" style={{ padding: 60, textAlign: 'center' }}>
          <Bookmark size={28} style={{ opacity: 0.25, marginBottom: 14 }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            {query || filterTag ? 'No matches.' : 'No bookmarks yet — save one above.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          <AnimatePresence>
            {filtered.map(b => (
              <motion.a
                key={b.id}
                href={b.url} target="_blank" rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="glass glass-hover"
                style={{ padding: 22, textDecoration: 'none', color: 'inherit', display: 'block', position: 'relative' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bookmark size={13} />
                  </div>
                  <button onClick={e => { e.preventDefault(); deleteBookmark(b.id); addToast('Removed', 'success') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted2)', padding: 4 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
                <div style={{ fontSize: '0.92rem', color: 'var(--cream)', fontWeight: 500, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {b.title}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                  <ExternalLink size={9} /> {getDomain(b.url)}
                </div>
                {b.description && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {b.description}
                  </div>
                )}
                {b.tag && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.55rem', padding: '3px 8px', borderRadius: 99, background: 'rgba(184,174,240,0.10)', border: '1px solid rgba(184,174,240,0.18)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>
                    <Tag size={9} /> {b.tag}
                  </span>
                )}
              </motion.a>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
