import React, { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import {
  LayoutDashboard, BookOpen, ClipboardList, Trophy, DollarSign,
  Heart, CheckSquare, Calendar, Users, Target, FileText,
  Settings, ChevronLeft, ChevronRight, ChevronDown, Bookmark,
  ShoppingBag, Mountain, Sparkles, Search, Command, Sun,
} from 'lucide-react'
import { useUIStore, useLocalStore } from '../../store'
import { getDayGreeting, dateAWST, isEndOfDay, isEndOfWeek } from '../../lib/time'
import ClockWidget from '../ui/ClockWidget'
import ReflectionTrigger from '../ui/ReflectionTrigger'

const navSections = [
  {
    label: null,
    items: [
      { to: '/overview', icon: LayoutDashboard, label: 'Overview' },
      { to: '/today',    icon: Sun,             label: 'Today' },
    ],
  },
  {
    label: 'Academic',
    items: [
      { to: '/academics',   icon: BookOpen,      label: 'Subjects & Grades' },
      { to: '/assignments', icon: ClipboardList, label: 'Assignments' },
    ],
  },
  {
    label: 'Productivity',
    items: [
      { to: '/tasks',     icon: CheckSquare, label: 'Tasks & Habits' },
      { to: '/calendar',  icon: Calendar,    label: 'Calendar' },
      { to: '/goals',     icon: Target,      label: 'Goals' },
      { to: '/skills',    icon: Sparkles,    label: 'Skills' },
    ],
  },
  {
    label: 'Wellness',
    items: [
      { to: '/health',    icon: Heart,    label: 'Health' },
      { to: '/athletics', icon: Trophy,   label: 'Athletics' },
    ],
  },
  {
    label: 'Life',
    items: [
      { to: '/finance',     icon: DollarSign,  label: 'Finance' },
      { to: '/social',      icon: Users,       label: 'Social' },
    ],
  },
  {
    label: 'Collections',
    items: [
      { to: '/notes',       icon: FileText,    label: 'Notes' },
      { to: '/bookmarks',   icon: Bookmark,    label: 'Bookmarks' },
      { to: '/wishlist',    icon: ShoppingBag, label: 'Wishlist' },
      { to: '/bucket-list', icon: Mountain,    label: 'Bucket List' },
    ],
  },
]

export default function Layout({ children }) {
  const { sidebarCollapsed, toggleSidebar, setShowDailyReflection, setShowWeeklyReflection } = useUIStore()
  const profile = useLocalStore((s) => s.profile)
  const sidebarRef = useRef(null)
  const location = useLocation()
  const [collapsedSections, setCollapsedSections] = useState({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    gsap.fromTo(sidebarRef.current,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
    )
  }, [])

  useEffect(() => {
    const check = () => {
      if (isEndOfDay()) {
        const lastDaily = localStorage.getItem('calloway-last-daily')
        if (lastDaily !== dateAWST()) setShowDailyReflection(true)
      }
      if (isEndOfWeek()) {
        const lastWeekly = localStorage.getItem('calloway-last-weekly')
        const weekKey = getWeekKey()
        if (lastWeekly !== weekKey) setShowWeeklyReflection(true)
      }
    }
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [])

  function getWeekKey() {
    const d = new Date()
    const start = new Date(d.setDate(d.getDate() - d.getDay()))
    return start.toISOString().split('T')[0]
  }

  const toggleSection = (label) => setCollapsedSections(s => ({ ...s, [label]: !s[label] }))

  // Filter nav items by search
  const filterNav = (items) => {
    if (!search) return items
    return items.filter(it => it.label.toLowerCase().includes(search.toLowerCase()))
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        ref={sidebarRef}
        className="sidebar"
        style={{ width: sidebarCollapsed ? '64px' : '232px', transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Logo */}
        <div style={{ padding: '0 16px 18px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="logo-orb" style={{
              width: 36, height: 36, borderRadius: 11,
              background: `
                radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 8%, transparent 22%),
                radial-gradient(circle at 70% 75%, rgba(184,174,240,0.5) 0%, transparent 35%),
                radial-gradient(circle at 50% 50%, #232333 0%, #0c0c14 75%, #050508 100%)
              `,
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: 'inset -3px -4px 8px rgba(0,0,0,0.55), inset 2px 2px 5px rgba(255,255,255,0.18), 0 4px 16px rgba(184,174,240,0.15)',
              flexShrink: 0,
            }} />
            {!sidebarCollapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 600, color: 'var(--cream)', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile.name || 'Calloway'}
                </div>
                <div style={{ fontSize: '0.52rem', color: 'var(--muted2)', letterSpacing: '0.24em', textTransform: 'uppercase', fontWeight: 700 }}>
                  Personal OS
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div style={{ padding: '0 12px 12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={11} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)' }} />
              <input
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '7px 10px 7px 30px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--cream)', fontSize: '0.72rem',
                  outline: 'none',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.18)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'rgba(255,255,255,0.03)' }}
              />
            </div>
          </div>
        )}

        {/* Clock */}
        {!sidebarCollapsed && <ClockWidget />}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {navSections.map((section, si) => {
            const filtered = filterNav(section.items)
            if (filtered.length === 0) return null
            const collapsed = collapsedSections[section.label]
            return (
              <div key={si} style={{ marginBottom: sidebarCollapsed ? 0 : 6 }}>
                {section.label && !sidebarCollapsed && (
                  <button
                    onClick={() => toggleSection(section.label)}
                    className="sidebar-section-label"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', width: '100%',
                      color: 'rgba(240,235,225,0.22)',
                    }}
                  >
                    <span>{section.label}</span>
                    <motion.div animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={9} />
                    </motion.div>
                  </button>
                )}
                {section.label && sidebarCollapsed && si > 0 && (
                  <div style={{ height: 1, background: 'var(--border)', margin: '8px 14px' }} />
                )}

                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      style={{ overflow: 'hidden' }}
                    >
                      {filtered.map(({ to, icon: Icon, label }) => (
                        <NavLink
                          key={to}
                          to={to}
                          title={sidebarCollapsed ? label : undefined}
                          className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                        >
                          {({ isActive }) => (
                            <>
                              <motion.div
                                animate={isActive ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                                transition={isActive ? { duration: 0.4, ease: 'easeOut' } : {}}
                                style={{ flexShrink: 0, display: 'flex' }}
                              >
                                <Icon size={15} />
                              </motion.div>
                              {!sidebarCollapsed && <span>{label}</span>}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
          {!sidebarCollapsed && <ReflectionTrigger />}
          <NavLink to="/settings" className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`} title={sidebarCollapsed ? 'Settings' : undefined}>
            <Settings size={15} style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && <span>Settings</span>}
          </NavLink>
          <button
            onClick={toggleSidebar}
            className="sidebar-nav-item"
            style={{ width: 'calc(100% - 20px)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}
          >
            {sidebarCollapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>

      <main
        className="main-content"
        style={{ marginLeft: sidebarCollapsed ? '64px' : '232px', transition: 'margin-left 0.3s cubic-bezier(0.16,1,0.3,1)', flex: 1 }}
      >
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
