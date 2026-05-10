import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { supabase } from './lib/supabase'
import { useAuthStore, useUIStore } from './store'
import Layout from './components/layout/Layout'
import Overview from './pages/Overview'
import Academics from './pages/Academics'
import Assignments from './pages/Assignments'
import Athletics from './pages/Athletics'
import Finance from './pages/Finance'
import Health from './pages/Health'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import Social from './pages/Social'
import Goals from './pages/Goals'
import Notes from './pages/Notes'
import Settings from './pages/Settings'
import Bookmarks from './pages/Bookmarks'
import Wishlist from './pages/Wishlist'
import BucketList from './pages/BucketList'
import Skills from './pages/Skills'
import Today from './pages/Today'
import DailyReflectionModal from './components/ui/DailyReflectionModal'
import WeeklyReflectionModal from './components/ui/WeeklyReflectionModal'
import Toast from './components/ui/Toast'
import BgOrbs from './components/ui/BgOrbs'
import CelebrationOverlay from './components/ui/CelebrationOverlay'
import InsightsDrawer from './components/ui/InsightsDrawer'
import useReactiveMood from './lib/useReactiveMood'

export default function App() {
  const { setSession, setLoading } = useAuthStore()
  const { showDailyReflection, showWeeklyReflection, toasts } = useUIStore()
  useReactiveMood()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      <BgOrbs />
      <div className="grain" />

      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview"    element={<Overview />} />
            <Route path="/today"       element={<Today />} />
            <Route path="/academics"   element={<Academics />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/athletics"   element={<Athletics />} />
            <Route path="/finance"     element={<Finance />} />
            <Route path="/health"      element={<Health />} />
            <Route path="/tasks"       element={<Tasks />} />
            <Route path="/calendar"    element={<Calendar />} />
            <Route path="/social"      element={<Social />} />
            <Route path="/goals"       element={<Goals />} />
            <Route path="/notes"       element={<Notes />} />
            <Route path="/bookmarks"   element={<Bookmarks />} />
            <Route path="/wishlist"    element={<Wishlist />} />
            <Route path="/bucket-list" element={<BucketList />} />
            <Route path="/skills"      element={<Skills />} />
            <Route path="/settings"    element={<Settings />} />
          </Routes>
        </AnimatePresence>
      </Layout>

      {showDailyReflection  && <DailyReflectionModal />}
      {showWeeklyReflection && <WeeklyReflectionModal />}

      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((t) => <Toast key={t.id} toast={t} />)}
        </AnimatePresence>
      </div>

      <CelebrationOverlay />
      <InsightsDrawer />
    </>
  )
}
