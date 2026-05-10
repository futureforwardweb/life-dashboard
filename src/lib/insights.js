/**
 * Auto-generates insights from store state.
 * Returns an array of insight objects sorted by severity.
 *
 * Each insight: { id, severity, title, body, action?: { label, route } }
 *   severity: 'positive' | 'neutral' | 'attention' | 'urgent'
 */

const SEV_ORDER = { urgent: 0, attention: 1, positive: 2, neutral: 3 }

export function generateInsights(store) {
  const insights = []
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const thisMonth = today.slice(0, 7)

  const lastMonthDate = new Date(); lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
  const lastMonth = lastMonthDate.toISOString().slice(0, 7)

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // ── FINANCE ─────────────────────────────────────────────────────────────────
  const thisMonthSpent = store.transactions
    .filter(t => t.type === 'expense' && t.date?.startsWith(thisMonth))
    .reduce((s, t) => s + parseFloat(t.amount || 0), 0)
  const lastMonthSpent = store.transactions
    .filter(t => t.type === 'expense' && t.date?.startsWith(lastMonth))
    .reduce((s, t) => s + parseFloat(t.amount || 0), 0)

  if (lastMonthSpent > 0 && thisMonthSpent > 0) {
    const change = ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100
    if (Math.abs(change) >= 15) {
      insights.push({
        id: 'spend-change',
        severity: change > 30 ? 'attention' : change > 0 ? 'neutral' : 'positive',
        title: change > 0 ? `Spending up ${Math.round(change)}%` : `Spending down ${Math.round(Math.abs(change))}%`,
        body: `$${thisMonthSpent.toFixed(0)} this month vs $${lastMonthSpent.toFixed(0)} last month.`,
        action: { label: 'Open Finance', route: '/finance' },
      })
    }
  }

  const thisMonthIncome = store.transactions
    .filter(t => t.type === 'income' && t.date?.startsWith(thisMonth))
    .reduce((s, t) => s + parseFloat(t.amount || 0), 0)
  const net = thisMonthIncome - thisMonthSpent
  if (thisMonthIncome > 0 && net < 0) {
    insights.push({
      id: 'over-budget',
      severity: 'urgent',
      title: 'Over budget this month',
      body: `Spending exceeds income by $${Math.abs(net).toFixed(0)}.`,
      action: { label: 'Review transactions', route: '/finance' },
    })
  }

  // ── HABITS ──────────────────────────────────────────────────────────────────
  store.habits.forEach(h => {
    // Recent skip streak
    let skipStreak = 0
    const d = new Date()
    while (skipStreak < 14) {
      const ds = d.toISOString().slice(0, 10)
      if (store.habitLogs.some(l => l.habitId === h.id && l.date === ds)) break
      skipStreak++
      d.setDate(d.getDate() - 1)
    }
    if (skipStreak >= 3 && skipStreak < 14) {
      insights.push({
        id: `habit-skip-${h.id}`,
        severity: skipStreak >= 5 ? 'attention' : 'neutral',
        title: `Skipped "${h.name}" ${skipStreak} day${skipStreak !== 1 ? 's' : ''}`,
        body: `Last logged ${skipStreak} days ago. Get back to it?`,
        action: { label: 'Open Tasks & Habits', route: '/tasks' },
      })
    }

    // Long active streak
    let activeStreak = 0
    const d2 = new Date()
    while (true) {
      const ds = d2.toISOString().slice(0, 10)
      if (store.habitLogs.some(l => l.habitId === h.id && l.date === ds)) {
        activeStreak++
        d2.setDate(d2.getDate() - 1)
      } else break
    }
    if (activeStreak >= 7) {
      insights.push({
        id: `habit-streak-${h.id}`,
        severity: 'positive',
        title: `${activeStreak}-day streak on "${h.name}"`,
        body: `You've kept this for over a week. Don't break it now.`,
      })
    }
  })

  // ── ACADEMICS ──────────────────────────────────────────────────────────────
  const overdueAssign = store.assignments.filter(a => a.status === 'pending' && a.dueDate < today)
  if (overdueAssign.length > 0) {
    insights.push({
      id: 'overdue-assign',
      severity: 'urgent',
      title: `${overdueAssign.length} overdue assignment${overdueAssign.length !== 1 ? 's' : ''}`,
      body: overdueAssign.slice(0, 3).map(a => a.title).join(', '),
      action: { label: 'Open Assignments', route: '/assignments' },
    })
  }

  const upcomingAssign = store.assignments.filter(a => a.status === 'pending' && a.dueDate >= today && a.dueDate <= new Date(now.getTime() + 3*24*60*60*1000).toISOString().slice(0,10))
  if (upcomingAssign.length >= 3) {
    insights.push({
      id: 'busy-week',
      severity: 'attention',
      title: `${upcomingAssign.length} assignments due in 3 days`,
      body: `Plan study time accordingly.`,
      action: { label: 'Open Assignments', route: '/assignments' },
    })
  }

  // Subject grade trends (with grade components)
  store.subjects.forEach(sub => {
    const comps = store.gradeComponents.filter(c => c.subjectId === sub.id && c.score !== '' && c.maxScore)
    if (comps.length < 3) return
    const recent = comps.slice(0, 2).map(c => (parseFloat(c.score) / parseFloat(c.maxScore)) * 100)
    const earlier = comps.slice(2).map(c => (parseFloat(c.score) / parseFloat(c.maxScore)) * 100)
    const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length
    const earlierAvg = earlier.reduce((s, v) => s + v, 0) / earlier.length
    const diff = recentAvg - earlierAvg
    if (Math.abs(diff) >= 8) {
      insights.push({
        id: `grade-trend-${sub.id}`,
        severity: diff < 0 ? 'attention' : 'positive',
        title: `${sub.name} ${diff > 0 ? 'trending up' : 'trending down'}`,
        body: `Recent average ${recentAvg.toFixed(1)}% vs ${earlierAvg.toFixed(1)}% earlier — ${diff > 0 ? '+' : ''}${diff.toFixed(1)} pts.`,
        action: { label: 'Open Subject', route: '/academics' },
      })
    }
  })

  // ── HEALTH ─────────────────────────────────────────────────────────────────
  const recentSleep = store.sleepLogs.slice(0, 7)
  if (recentSleep.length >= 3) {
    const avgHours = recentSleep.reduce((s, l) => s + parseFloat(l.hours || 0), 0) / recentSleep.length
    if (avgHours < 6.5) {
      insights.push({
        id: 'sleep-low',
        severity: avgHours < 5.5 ? 'urgent' : 'attention',
        title: `Sleep averaging ${avgHours.toFixed(1)}h`,
        body: 'Below 7h consistently. Consider an earlier bedtime.',
        action: { label: 'Open Health', route: '/health' },
      })
    } else if (avgHours >= 7.5) {
      insights.push({
        id: 'sleep-good',
        severity: 'positive',
        title: `Sleep averaging ${avgHours.toFixed(1)}h`,
        body: 'Solid recovery this week.',
      })
    }
  }

  // Mood trend
  const recentMood = store.moodLogs.slice(0, 7).map(m => parseFloat(m.mood)).filter(Boolean)
  if (recentMood.length >= 4) {
    const avg = recentMood.reduce((s, v) => s + v, 0) / recentMood.length
    if (avg < 5) {
      insights.push({
        id: 'mood-low',
        severity: 'attention',
        title: `Mood averaging ${avg.toFixed(1)}/10`,
        body: 'Last week has been tough. Check in with yourself.',
        action: { label: 'Open Health', route: '/health' },
      })
    }
  }

  // ── TASKS ──────────────────────────────────────────────────────────────────
  const overdueTasks = store.tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today)
  if (overdueTasks.length >= 3) {
    insights.push({
      id: 'overdue-tasks',
      severity: 'attention',
      title: `${overdueTasks.length} overdue tasks`,
      body: 'Reschedule what you can; tackle one today.',
      action: { label: 'Open Tasks', route: '/tasks' },
    })
  }

  const completedThisWeek = store.tasks.filter(t => t.completed && t.completedAt >= sevenDaysAgo).length
  if (completedThisWeek >= 10) {
    insights.push({
      id: 'task-momentum',
      severity: 'positive',
      title: `${completedThisWeek} tasks done this week`,
      body: 'Strong execution. Whatever system you have is working.',
    })
  }

  // ── GOALS ──────────────────────────────────────────────────────────────────
  const stalledGoals = store.goals.filter(g => (g.progress ?? 0) < 30 && new Date(g.createdAt) < new Date(now - 30 * 24 * 60 * 60 * 1000))
  if (stalledGoals.length > 0) {
    insights.push({
      id: 'goals-stalled',
      severity: 'neutral',
      title: `${stalledGoals.length} stalled goal${stalledGoals.length !== 1 ? 's' : ''}`,
      body: 'Less than 30% after a month. Break it down further or drop it.',
      action: { label: 'Open Goals', route: '/goals' },
    })
  }

  return insights.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])
}
