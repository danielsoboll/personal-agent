/** Frist-Anzeige für Europe/Berlin — gemeinsame Formatierung. */

export function daysUntilDeadline(deadline: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(deadline)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const target = new Date(Date.UTC(year, month - 1, day))

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const todayKey = formatter.format(new Date())
  const [ty, tm, td] = todayKey.split('-').map(Number)
  const today = new Date(Date.UTC(ty, tm - 1, td))

  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function formatDeadlineDate(deadline: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return deadline
  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${deadline}T00:00:00Z`))
}

export function formatDeadlineShort(deadline: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return deadline
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${deadline}T00:00:00Z`))
}

export function formatDaysRemaining(days: number): string {
  if (days < 0) {
    const overdue = Math.abs(days)
    return overdue === 1 ? 'seit 1 Tag überfällig' : `seit ${overdue} Tagen überfällig`
  }
  if (days === 0) return 'Heute ist der letzte Tag'
  if (days === 1) return 'Noch 1 Tag Zeit'
  return `Noch ${days} Tage Zeit`
}
