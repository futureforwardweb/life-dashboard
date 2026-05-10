import { useEffect } from 'react'
import { useLocalStore } from '../store'
import { dateAWST } from './time'

/**
 * Drives CSS custom properties on <html> so the whole app responds to:
 *  • Time of day (cool/warm tint, brightness)
 *  • Productivity (chrome sphere glow, breathing tempo)
 *  • Urgency (overdue items → faster animations, sharper accents)
 *  • Calm (inbox-zero → slower breathing, softer)
 *
 * Read-only. Pages don't need to know — CSS reacts.
 */

function getTimeOfDayPreset(hour) {
  // Returns { warmth (0-1), brightness (0.85-1.05), label }
  if (hour >= 5 && hour < 11)  return { warmth: 0.3, brightness: 1.02, label: 'morning' }
  if (hour >= 11 && hour < 17) return { warmth: 0.5, brightness: 1.0,  label: 'day' }
  if (hour >= 17 && hour < 21) return { warmth: 0.8, brightness: 0.96, label: 'evening' }
  return { warmth: 0.15, brightness: 0.92, label: 'night' }
}

export default function useReactiveMood() {
  const tasks = useLocalStore(s => s.tasks)
  const habits = useLocalStore(s => s.habits)
  const habitLogs = useLocalStore(s => s.habitLogs)
  const assignments = useLocalStore(s => s.assignments)

  useEffect(() => {
    const apply = () => {
      const today = dateAWST()
      const now = new Date()
      const hour = now.getHours()

      // Time of day
      const tod = getTimeOfDayPreset(hour)

      // Productivity — fraction of today's possible wins completed
      const completedTasks = tasks.filter(t => t.completed && t.completedAt?.startsWith(today)).length
      const todayTasks = tasks.filter(t => !t.completed && t.dueDate === today).length
      const habitsDone = habits.filter(h => habitLogs.some(l => l.habitId === h.id && l.date === today)).length
      const totalPossible = completedTasks + todayTasks + Math.max(habits.length, 1)
      const winsToday = completedTasks + habitsDone
      const productivity = totalPossible > 0 ? Math.min(winsToday / totalPossible, 1) : 0

      // Urgency — overdue assignments + overdue tasks
      const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today).length
      const overdueAssign = assignments.filter(a => a.status === 'pending' && a.dueDate < today).length
      const overdueCount = overdueTasks + overdueAssign
      const urgency = Math.min(overdueCount / 5, 1) // 5+ overdue maxes out

      // Calm — inverse of urgency, plus inbox-zero bonus
      const inboxZero = todayTasks === 0 && habitsDone === habits.length
      const calm = inboxZero ? 1 : (1 - urgency) * 0.7

      // Tempo multiplier — urgency speeds up, calm slows down
      // Base = 1, urgent = 0.65 (faster), calm = 1.3 (slower)
      const tempo = 1 - urgency * 0.35 + calm * 0.3

      // Glow intensity (chrome sphere radiance) — productivity drives it
      const glow = 0.3 + productivity * 0.7

      // Apply to root
      const root = document.documentElement
      root.style.setProperty('--mood-warmth', tod.warmth.toFixed(2))
      root.style.setProperty('--mood-brightness', tod.brightness.toFixed(2))
      root.style.setProperty('--mood-tod', tod.label)
      root.style.setProperty('--mood-productivity', productivity.toFixed(2))
      root.style.setProperty('--mood-urgency', urgency.toFixed(2))
      root.style.setProperty('--mood-calm', calm.toFixed(2))
      root.style.setProperty('--mood-tempo', tempo.toFixed(2))
      root.style.setProperty('--mood-glow', glow.toFixed(2))
      root.dataset.tod = tod.label
      root.dataset.urgent = overdueCount > 0 ? 'true' : 'false'
      root.dataset.calm = inboxZero ? 'true' : 'false'
    }

    apply()
    const id = setInterval(apply, 60_000) // re-evaluate each minute (time of day)
    return () => clearInterval(id)
  }, [tasks, habits, habitLogs, assignments])
}
