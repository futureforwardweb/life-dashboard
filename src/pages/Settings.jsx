import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Palette, Database, Shield, Download, Trash2, Check } from 'lucide-react'
import { useLocalStore, useUIStore, useAuthStore } from '../store'
import { supabase } from '../lib/supabase'

const ACCENTS = [
  { key: 'dusk',  label: 'Dusk',   color: '#9b8fd4', desc: 'Cool purple — default' },
  { key: 'clay',  label: 'Clay',   color: '#e0784a', desc: 'Warm terracotta' },
  { key: 'sage',  label: 'Sage',   color: '#6dbf8a', desc: 'Muted green' },
  { key: 'teal',  label: 'Teal',   color: '#4ec9b8', desc: 'Ocean blue-green' },
  { key: 'rose',  label: 'Rose',   color: '#e8607a', desc: 'Deep pink' },
  { key: 'amber', label: 'Amber',  color: '#f0a24a', desc: 'Golden warm' },
]

export default function Settings() {
  const { profile, updateProfile } = useLocalStore()
  const { accentColor, setAccent, addToast } = useUIStore()
  const { user, signOut } = useAuthStore()
  const [tab, setTab] = useState('profile')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  async function handleAuth() {
    setAuthLoading(true); setAuthError('')
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        addToast('Signed in ✦', 'success')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        addToast('Account created — check your email', 'success')
      }
    } catch (e) { setAuthError(e.message) }
    finally { setAuthLoading(false) }
  }

  function exportData() {
    const store = JSON.parse(localStorage.getItem('calloway-data') || '{}')
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `calloway-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click(); URL.revokeObjectURL(url)
    addToast('Data exported', 'success')
  }

  function clearData() {
    if (!confirm('This will permanently delete ALL local data. Are you sure?')) return
    localStorage.removeItem('calloway-data')
    addToast('All local data cleared', 'success')
    setTimeout(() => window.location.reload(), 1000)
  }

  const TABS = [
    { k: 'profile', l: 'Profile', icon: User },
    { k: 'appearance', l: 'Appearance', icon: Palette },
    { k: 'account', l: 'Account', icon: Shield },
    { k: 'data', l: 'Data', icon: Database },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Profile, appearance &amp; data management</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(({ k, l, icon: Icon }) => (
          <button key={k} onClick={() => setTab(k)} style={{
            fontSize: '0.65rem', padding: '8px 18px', borderRadius: 99, border: '1px solid',
            textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
            borderColor: tab === k ? 'var(--dusk)' : 'var(--border)',
            background: tab === k ? 'rgba(155,143,212,0.15)' : 'transparent',
            color: tab === k ? 'var(--dusk)' : 'var(--muted)',
          }}>
            <Icon size={12} />{l}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: 36, maxWidth: 560 }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 32 }}>
            <div style={{ width: 76, height: 76, borderRadius: 20, background: 'linear-gradient(135deg, var(--dusk), var(--clay))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontFamily: 'Cormorant Garamond, serif', color: '#fff', fontWeight: 600, flexShrink: 0 }}>
              {profile.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', color: 'var(--cream)', fontWeight: 600, marginBottom: 3 }}>{profile.name || 'Your Name'}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{profile.school || 'School not set'}</div>
              {profile.sport && <div style={{ fontSize: '0.68rem', color: 'var(--clay)', marginTop: 2 }}>{profile.sport}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Your name', key: 'name', placeholder: 'e.g. Jordan' },
              { label: 'School', key: 'school', placeholder: 'Your school name' },
              { label: 'Sport / team', key: 'sport', placeholder: 'e.g. Football, Basketball' },
              { label: 'Target ATAR', key: 'targetAtar', placeholder: 'e.g. 95.00' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: '0.62rem', color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600 }}>{label}</label>
                <input className="input-base" placeholder={placeholder} value={profile[key] || ''} onChange={e => updateProfile({ [key]: e.target.value })} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '0.62rem', color: 'var(--muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600 }}>Bio</label>
              <textarea className="input-base" placeholder="A short note about yourself…" rows={3} value={profile.bio || ''} onChange={e => updateProfile({ bio: e.target.value })} style={{ resize: 'vertical' }} />
            </div>
          </div>

          <button className="btn btn-primary" style={{ marginTop: 22 }} onClick={() => addToast('Profile saved ✦', 'success')}>
            <Check size={14} /> Save Profile
          </button>
        </motion.div>
      )}

      {/* Appearance */}
      {tab === 'appearance' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass" style={{ padding: 32, maxWidth: 600, marginBottom: 20 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: 6 }}>Accent Colour</div>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 22, lineHeight: 1.6 }}>Sets the primary interactive colour across the dashboard.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {ACCENTS.map(a => (
                <button key={a.key} onClick={() => { setAccent(a.key); document.documentElement.style.setProperty('--accent', a.color) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12,
                    border: `2px solid ${accentColor === a.key ? a.color : 'var(--border)'}`,
                    background: accentColor === a.key ? `${a.color}15` : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer', transition: 'all 0.18s', textAlign: 'left' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: a.color, flexShrink: 0, boxShadow: accentColor === a.key ? `0 0 12px ${a.color}60` : 'none' }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', color: accentColor === a.key ? a.color : 'var(--cream)', fontWeight: 600 }}>{a.label}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{a.desc}</div>
                  </div>
                  {accentColor === a.key && <Check size={14} color={a.color} style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>
          </div>

          <div className="glass" style={{ padding: 32, maxWidth: 600 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: 16 }}>Typography</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { font: 'Cormorant Garamond, serif', role: 'Display / Numbers', sample: 'Aa 0123 99.95' },
                { font: 'Epilogue, sans-serif', role: 'Body / UI text', sample: 'Aa — task lists, forms' },
                { font: 'JetBrains Mono, monospace', role: 'Monospace / Time', sample: '09:41:00 · 25:00' },
              ].map(({ font, role, sample }) => (
                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>{role}</div>
                    <div style={{ fontFamily: font, fontSize: '1rem', color: 'var(--cream)' }}>{sample}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Account */}
      {tab === 'account' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: 36, maxWidth: 480 }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: 6 }}>Supabase Sync</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 26, lineHeight: 1.7 }}>
            Connect Supabase to sync your data across devices. All data is stored locally by default — login is optional.
          </p>

          {user ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(109,191,138,0.08)', border: '1px solid rgba(109,191,138,0.2)', borderRadius: 12, marginBottom: 22 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage)', boxShadow: '0 0 8px rgba(109,191,138,0.5)' }} />
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--sage)', fontWeight: 600 }}>Connected</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{user.email}</div>
                </div>
              </div>
              <button className="btn btn-danger" onClick={signOut}>Sign Out</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
                {['login', 'signup'].map(m => (
                  <button key={m} onClick={() => setAuthMode(m)} style={{
                    flex: 1, padding: '9px', borderRadius: 9, border: '1px solid', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 500,
                    borderColor: authMode === m ? 'var(--dusk)' : 'var(--border)',
                    background: authMode === m ? 'rgba(155,143,212,0.15)' : 'transparent',
                    color: authMode === m ? 'var(--dusk)' : 'var(--muted)',
                  }}>{m === 'login' ? 'Sign In' : 'Create Account'}</button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <input type="email" className="input-base" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" className="input-base" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              {authError && <div style={{ fontSize: '0.72rem', color: 'var(--rose)', marginBottom: 12 }}>{authError}</div>}
              <button className="btn btn-primary" onClick={handleAuth} disabled={authLoading} style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }}>
                {authLoading ? 'Loading…' : authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
              <div style={{ padding: '16px 18px', background: 'rgba(155,143,212,0.06)', borderRadius: 12, border: '1px solid rgba(155,143,212,0.12)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--dusk)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 10 }}>Setup Guide</div>
                <ol style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 2, margin: 0, paddingLeft: 18 }}>
                  <li>Go to supabase.com — create a free project</li>
                  <li>Copy your project URL &amp; anon key</li>
                  <li>Add to .env.local and restart the server</li>
                </ol>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Data */}
      {tab === 'data' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>
          <div className="glass" style={{ padding: 32 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: 8 }}>Export Data</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 22, lineHeight: 1.7 }}>
              Download all your Calloway data as a JSON backup. This includes tasks, habits, goals, finance, health, and academic records.
            </p>
            <button className="btn btn-primary" onClick={exportData}>
              <Download size={14} /> Export JSON Backup
            </button>
          </div>

          <div className="glass" style={{ padding: 32, border: '1px solid rgba(232,96,122,0.2)', background: 'rgba(232,96,122,0.03)' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--rose)', marginBottom: 8 }}>Danger Zone</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 22, lineHeight: 1.7 }}>
              Permanently erases all locally stored data. This cannot be undone — export a backup first if needed.
            </p>
            <button className="btn btn-danger" onClick={clearData}>
              <Trash2 size={14} /> Clear All Local Data
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
