const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Riyadh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// Returns 'YYYY-MM-DD' in Saudi time for a date or timestamp.
export function dayOf(value) {
  if (!value) return ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? '' : dayFormat.format(parsed)
}

// True when the date falls inside the chosen range (both ends included).
// With no range chosen, everything matches.
export function inDateRange(value, from, to) {
  if (!from && !to) return true

  const day = dayOf(value)

  if (!day) return false

  return (!from || day >= from) && (!to || day <= to)
}

export function shift(days) {
  const date = new Date()

  date.setDate(date.getDate() + days)

  return dayFormat.format(date)
}