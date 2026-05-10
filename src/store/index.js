import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

// ── Auth store ──
export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))

// Default dashboard layout — widget id + grid span (out of 12)
const DEFAULT_DASHBOARD = [
  { id: 'today',     span: 12 },
  { id: 'stats',     span: 12 },
  { id: 'upcoming',  span: 6 },
  { id: 'priority',  span: 6 },
  { id: 'habits',    span: 4 },
  { id: 'mood',      span: 4 },
  { id: 'finance',   span: 4 },
]

// ── UI store ──
export const useUIStore = create(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: 'dark',
      accentColor: 'dusk',
      activeModule: 'overview',
      toasts: [],
      showDailyReflection: false,
      showWeeklyReflection: false,

      // Dashboard customization
      dashboardLayout: DEFAULT_DASHBOARD,
      dashboardEditing: false,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setAccent: (accentColor) => set({ accentColor }),
      setActiveModule: (mod) => set({ activeModule: mod }),
      setShowDailyReflection: (v) => set({ showDailyReflection: v }),
      setShowWeeklyReflection: (v) => set({ showWeeklyReflection: v }),

      // Dashboard mutations
      setDashboardEditing: (v) => set({ dashboardEditing: v }),
      setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
      addDashboardWidget: (id, span = 6) => set((s) => {
        if (s.dashboardLayout.find(w => w.id === id)) return s
        return { dashboardLayout: [...s.dashboardLayout, { id, span }] }
      }),
      removeDashboardWidget: (id) => set((s) => ({
        dashboardLayout: s.dashboardLayout.filter(w => w.id !== id),
      })),
      updateDashboardWidget: (id, updates) => set((s) => ({
        dashboardLayout: s.dashboardLayout.map(w => w.id === id ? { ...w, ...updates } : w),
      })),
      moveDashboardWidget: (id, direction) => set((s) => {
        const idx = s.dashboardLayout.findIndex(w => w.id === id)
        if (idx === -1) return s
        const newIdx = direction === 'up' ? idx - 1 : idx + 1
        if (newIdx < 0 || newIdx >= s.dashboardLayout.length) return s
        const next = [...s.dashboardLayout]
        ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
        return { dashboardLayout: next }
      }),
      resetDashboard: () => set({ dashboardLayout: DEFAULT_DASHBOARD }),

      addToast: (message, type = 'success') => {
        const id = Date.now()
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
        }, 3500)
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'calloway-ui',
      partialize: (s) => ({
        theme: s.theme,
        accentColor: s.accentColor,
        sidebarCollapsed: s.sidebarCollapsed,
        dashboardLayout: s.dashboardLayout,
      }),
    }
  )
)

// ── Local data store (fallback when Supabase not configured) ──
export const useLocalStore = create(
  persist(
    (set, get) => ({
      // Tasks (with cross-linking: goalId)
      tasks: [],
      addTask: (task) => set((s) => ({ tasks: [{ ...task, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...s.tasks] })),
      updateTask: (id, updates) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      // Smart task completion — flips state and bumps linked goal progress
      toggleTaskComplete: (id) => set((s) => {
        const t = s.tasks.find(x => x.id === id)
        if (!t) return s
        const nowComplete = !t.completed
        const nextTasks = s.tasks.map(x => x.id === id
          ? { ...x, completed: nowComplete, completedAt: nowComplete ? new Date().toISOString() : null }
          : x)

        // If task is linked to a goal, recompute that goal's progress from completion ratio of linked tasks
        if (t.goalId) {
          const linked = nextTasks.filter(tt => tt.goalId === t.goalId)
          const done = linked.filter(tt => tt.completed).length
          const pct = linked.length > 0 ? Math.round((done / linked.length) * 100) : 0
          return {
            tasks: nextTasks,
            goals: s.goals.map(g => g.id === t.goalId ? { ...g, progress: pct } : g),
          }
        }
        return { tasks: nextTasks }
      }),

      // Habits (with cross-linking: skillId — logging a habit auto-bumps skill hours)
      habits: [],
      habitLogs: [],
      addHabit: (habit) => set((s) => ({ habits: [{ ...habit, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...s.habits] })),
      logHabit: (habitId, date) => set((s) => {
        const exists = s.habitLogs.find((l) => l.habitId === habitId && l.date === date)
        if (exists) return { habitLogs: s.habitLogs.filter((l) => !(l.habitId === habitId && l.date === date)) }
        const habit = s.habits.find(h => h.id === habitId)
        const next = { habitLogs: [...s.habitLogs, { id: Date.now().toString(), habitId, date }] }
        // Auto-add hour to linked skill
        if (habit?.skillId) {
          next.skills = s.skills.map(sk => sk.id === habit.skillId
            ? { ...sk, hoursLogged: parseFloat(sk.hoursLogged || 0) + (parseFloat(habit.duration) || 0.5) }
            : sk)
        }
        return next
      }),
      deleteHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

      // Goals
      goals: [],
      addGoal: (goal) => set((s) => ({ goals: [{ ...goal, id: Date.now().toString(), createdAt: new Date().toISOString(), progress: 0 }, ...s.goals] })),
      updateGoal: (id, updates) => set((s) => ({ goals: s.goals.map((g) => g.id === id ? { ...g, ...updates } : g) })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      // Finance
      transactions: [],
      budgets: [],
      savingsGoals: [],
      addTransaction: (t) => set((s) => ({ transactions: [{ ...t, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...s.transactions] })),
      deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      addBudget: (b) => set((s) => ({ budgets: [{ ...b, id: Date.now().toString() }, ...s.budgets] })),
      updateBudget: (id, updates) => set((s) => ({ budgets: s.budgets.map((b) => b.id === id ? { ...b, ...updates } : b) })),
      addSavingsGoal: (g) => set((s) => ({ savingsGoals: [{ ...g, id: Date.now().toString() }, ...s.savingsGoals] })),
      updateSavingsGoal: (id, updates) => set((s) => ({ savingsGoals: s.savingsGoals.map((g) => g.id === id ? { ...g, ...updates } : g) })),

      // Notes
      notes: [],
      addNote: (n) => set((s) => ({ notes: [{ ...n, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...s.notes] })),
      updateNote: (id, updates) => set((s) => ({ notes: s.notes.map((n) => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n) })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      // Bookmarks
      bookmarks: [],
      addBookmark: (b) => set((s) => ({ bookmarks: [{ ...b, id: Date.now().toString() }, ...s.bookmarks] })),
      deleteBookmark: (id) => set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),

      // Health
      sleepLogs: [],
      waterLogs: [],
      workoutLogs: [],
      moodLogs: [],
      bodyMetrics: [],
      addSleepLog: (l) => set((s) => ({ sleepLogs: [{ ...l, id: Date.now().toString() }, ...s.sleepLogs] })),
      addWaterLog: (l) => set((s) => ({ waterLogs: [{ ...l, id: Date.now().toString() }, ...s.waterLogs] })),
      addWorkoutLog: (l) => set((s) => ({ workoutLogs: [{ ...l, id: Date.now().toString() }, ...s.workoutLogs] })),
      addMoodLog: (l) => set((s) => ({ moodLogs: [{ ...l, id: Date.now().toString() }, ...s.moodLogs] })),
      addBodyMetric: (m) => set((s) => ({ bodyMetrics: [{ ...m, id: Date.now().toString() }, ...s.bodyMetrics] })),

      // Academics
      subjects: [],
      assignments: [],
      studySessions: [],
      addSubject: (s_) => set((s) => ({ subjects: [{ ...s_, id: Date.now().toString() }, ...s.subjects] })),
      updateSubject: (id, updates) => set((s) => ({ subjects: s.subjects.map((s_) => s_.id === id ? { ...s_, ...updates } : s_) })),
      deleteSubject: (id) => set((s) => ({ subjects: s.subjects.filter((s_) => s_.id !== id) })),
      addAssignment: (a) => set((s) => ({ assignments: [{ ...a, id: Date.now().toString(), status: 'pending', createdAt: new Date().toISOString() }, ...s.assignments] })),
      updateAssignment: (id, updates) => set((s) => ({ assignments: s.assignments.map((a) => a.id === id ? { ...a, ...updates } : a) })),
      deleteAssignment: (id) => set((s) => ({ assignments: s.assignments.filter((a) => a.id !== id) })),
      addStudySession: (s_) => set((s) => ({ studySessions: [{ ...s_, id: Date.now().toString() }, ...s.studySessions] })),

      // Sports
      games: [],
      trainingSessions: [],
      addGame: (g) => set((s) => ({ games: [{ ...g, id: Date.now().toString() }, ...s.games] })),
      updateGame: (id, updates) => set((s) => ({ games: s.games.map((g) => g.id === id ? { ...g, ...updates } : g) })),
      addTrainingSession: (t) => set((s) => ({ trainingSessions: [{ ...t, id: Date.now().toString() }, ...s.trainingSessions] })),

      // Social
      contacts: [],
      socialEvents: [],
      gratitudeEntries: [],
      addContact: (c) => set((s) => ({ contacts: [{ ...c, id: Date.now().toString() }, ...s.contacts] })),
      updateContact: (id, updates) => set((s) => ({ contacts: s.contacts.map((c) => c.id === id ? { ...c, ...updates } : c) })),
      addSocialEvent: (e) => set((s) => ({ socialEvents: [{ ...e, id: Date.now().toString() }, ...s.socialEvents] })),
      addGratitude: (g) => set((s) => ({ gratitudeEntries: [{ ...g, id: Date.now().toString(), date: new Date().toISOString() }, ...s.gratitudeEntries] })),

      // Reflections
      dailyReflections: [],
      weeklyReflections: [],
      addDailyReflection: (r) => set((s) => ({ dailyReflections: [{ ...r, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...s.dailyReflections] })),
      addWeeklyReflection: (r) => set((s) => ({ weeklyReflections: [{ ...r, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...s.weeklyReflections] })),

      // Vision board
      visionItems: [],
      addVisionItem: (v) => set((s) => ({ visionItems: [{ ...v, id: Date.now().toString() }, ...s.visionItems] })),
      deleteVisionItem: (id) => set((s) => ({ visionItems: s.visionItems.filter((v) => v.id !== id) })),

      // Skills
      skills: [],
      addSkill: (sk) => set((s) => ({ skills: [{ ...sk, id: Date.now().toString() }, ...s.skills] })),
      updateSkill: (id, updates) => set((s) => ({ skills: s.skills.map((sk) => sk.id === id ? { ...sk, ...updates } : sk) })),

      // Bucket list
      bucketList: [],
      addBucketItem: (b) => set((s) => ({ bucketList: [{ ...b, id: Date.now().toString(), completed: false }, ...s.bucketList] })),
      toggleBucketItem: (id) => set((s) => ({ bucketList: s.bucketList.map((b) => b.id === id ? { ...b, completed: !b.completed } : b) })),

      // Profile
      profile: { name: '', avatar: null, bio: '', school: '', sport: '', targetAtar: '' },
      updateProfile: (updates) => set((s) => ({ profile: { ...s.profile, ...updates } })),

      // Wishlist / shopping
      wishlist: [],
      addWishlistItem: (item) => set((s) => ({ wishlist: [{ ...item, id: Date.now().toString(), purchased: false, createdAt: new Date().toISOString() }, ...s.wishlist] })),
      updateWishlistItem: (id, updates) => set((s) => ({ wishlist: s.wishlist.map((w) => w.id === id ? { ...w, ...updates } : w) })),
      deleteWishlistItem: (id) => set((s) => ({ wishlist: s.wishlist.filter((w) => w.id !== id) })),
      toggleWishlistPurchased: (id) => set((s) => ({ wishlist: s.wishlist.map((w) => w.id === id ? { ...w, purchased: !w.purchased } : w) })),

      // Accounts (bank, paypal, cash etc.)
      accounts: [],
      addAccount: (a) => set((s) => ({ accounts: [{ ...a, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...s.accounts] })),
      updateAccount: (id, updates) => set((s) => ({ accounts: s.accounts.map((a) => a.id === id ? { ...a, ...updates } : a) })),
      deleteAccount: (id) => set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

      // Grade components (for weighted average calculator)
      gradeComponents: [],
      addGradeComponent: (c) => set((s) => ({ gradeComponents: [{ ...c, id: Date.now().toString() }, ...s.gradeComponents] })),
      updateGradeComponent: (id, updates) => set((s) => ({ gradeComponents: s.gradeComponents.map((c) => c.id === id ? { ...c, ...updates } : c) })),
      deleteGradeComponent: (id) => set((s) => ({ gradeComponents: s.gradeComponents.filter((c) => c.id !== id) })),

      // Quick links
      quickLinks: [],
      addQuickLink: (l) => set((s) => ({ quickLinks: [{ ...l, id: Date.now().toString() }, ...s.quickLinks] })),
      deleteQuickLink: (id) => set((s) => ({ quickLinks: s.quickLinks.filter((l) => l.id !== id) })),

      // Events (calendar)
      events: [],
      addEvent: (e) => set((s) => ({ events: [{ ...e, id: Date.now().toString() }, ...s.events] })),
      updateEvent: (id, updates) => set((s) => ({ events: s.events.map((e) => e.id === id ? { ...e, ...updates } : e) })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
    }),
    { name: 'calloway-data' }
  )
)
