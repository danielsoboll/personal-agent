import { formatDeadlineDate } from '@/lib/deadlineDisplay'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** YYYY-MM-DD → ICS DATE */
export function toIcsDate(deadline: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return null
  return deadline.replace(/-/g, '')
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildDeadlineIcs(options: {
  deadline: string
  title: string
  description?: string
}): string | null {
  const date = toIcsDate(options.deadline)
  if (!date) return null

  const stamp = new Date()
  const dtstamp = `${stamp.getUTCFullYear()}${pad(stamp.getUTCMonth() + 1)}${pad(stamp.getUTCDate())}T${pad(stamp.getUTCHours())}${pad(stamp.getUTCMinutes())}${pad(stamp.getUTCSeconds())}Z`
  const uid = `behoerdenpost-${date}-${Math.random().toString(36).slice(2, 10)}@post.life-xp.de`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Behördenpost//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${date}`,
    `SUMMARY:${escapeIcsText(options.title)}`,
    options.description
      ? `DESCRIPTION:${escapeIcsText(options.description)}`
      : `DESCRIPTION:${escapeIcsText(`Frist am ${formatDeadlineDate(options.deadline)}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}

export function downloadDeadlineIcs(options: {
  deadline: string
  title: string
  description?: string
  fileName?: string
}): boolean {
  const ics = buildDeadlineIcs(options)
  if (!ics || typeof window === 'undefined') return false

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = options.fileName ?? `Frist_${options.deadline}.ics`
  anchor.click()
  URL.revokeObjectURL(url)
  return true
}
