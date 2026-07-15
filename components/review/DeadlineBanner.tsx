'use client'

import { daysUntilDeadline, formatDaysRemaining, formatDeadlineDate } from '@/lib/deadlineDisplay'
import { downloadDeadlineIcs } from '@/lib/calendarExport'
import { buttonStyles } from '@/lib/buttonStyles'

type DeadlineBannerProps = {
  deadline?: string
  label?: string
  caseTitle?: string
}

export default function DeadlineBanner({ deadline, label, caseTitle }: DeadlineBannerProps) {
  if (!deadline) return null

  const deadlineValue = deadline
  const days = daysUntilDeadline(deadlineValue)
  const urgency =
    days === null ? 'normal' : days < 0 ? 'overdue' : days <= 7 ? 'soon' : 'normal'

  const tone =
    urgency === 'overdue'
      ? 'border-red-400 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100'
      : urgency === 'soon'
        ? 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100'
        : 'border-accent bg-accent-soft text-foreground'

  const daysLine =
    days === null ? null : days < 0 ? formatDaysRemaining(days) : formatDaysRemaining(days)

  function handleAddToCalendar() {
    const deadlineLabel = label?.trim() || 'Frist'
    downloadDeadlineIcs({
      deadline: deadlineValue,
      title: `${deadlineLabel}${caseTitle ? ` — ${caseTitle}` : ''}`.slice(0, 120),
      description: `Behördenpost${caseTitle ? `: ${caseTitle}` : ''}`,
      fileName: `Frist_${deadlineValue}.ics`,
    })
  }

  return (
    <div className={`rounded-2xl border-2 px-5 py-4 ${tone}`} role="status">
      <p className="text-sm font-semibold uppercase tracking-wide opacity-80">Frist</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{formatDeadlineDate(deadlineValue)}</p>
      {daysLine ? <p className="mt-1 text-base font-semibold">{daysLine}</p> : null}
      {label?.trim() ? <p className="mt-1 text-sm opacity-80">{label.trim()}</p> : null}
      <button type="button" onClick={handleAddToCalendar} className={`mt-3 ${buttonStyles.secondary} !h-11`}>
        In Kalender
      </button>
    </div>
  )
}
