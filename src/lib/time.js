import { toZonedTime, format as tzFormat } from 'date-fns-tz'
import { format, isToday, isYesterday, differenceInDays } from 'date-fns'

export const AWST = 'Australia/Perth'

export function nowAWST() {
  return toZonedTime(new Date(), AWST)
}

export function formatAWST(date, fmt = 'dd MMM yyyy') {
  const zoned = toZonedTime(date instanceof Date ? date : new Date(date), AWST)
  return tzFormat(zoned, fmt, { timeZone: AWST })
}

export function timeAWST() {
  return tzFormat(toZonedTime(new Date(), AWST), 'HH:mm', { timeZone: AWST })
}

export function dateAWST() {
  return tzFormat(toZonedTime(new Date(), AWST), 'yyyy-MM-dd', { timeZone: AWST })
}

export function isEndOfDay() {
  const hour = nowAWST().getHours()
  return hour >= 20 // 8pm AWST triggers end-of-day prompt
}

export function isEndOfWeek() {
  const now = nowAWST()
  return now.getDay() === 0 && now.getHours() >= 19 // Sunday 7pm AWST
}

export function relativeDay(dateStr) {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  const diff = differenceInDays(d, new Date())
  if (diff === 1) return 'Tomorrow'
  if (diff > 0 && diff <= 7) return format(d, 'EEEE')
  return format(d, 'dd MMM')
}

export function getDayGreeting() {
  const hour = nowAWST().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 20) return 'Good evening'
  return 'Good night'
}
