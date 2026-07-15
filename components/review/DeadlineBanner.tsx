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
      ? 'border-red-300 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100'
      : urgency === 'soon'
        ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
        : 'border-accent/30 bg-accent-soft text-foreground'

  const headline =
    urgency === 'overdue' ? 'Frist abgelaufen' : urgency === 'soon' ? 'Frist bald' : 'Wichtige Frist'

  const deadlineLabel = label?.trim() || 'Wichtige Frist'

  function handleAddToCalendar() {
    downloadDeadlineIcs({
      deadline: deadlineValue,
      title: `${deadlineLabel}${caseTitle ? ` — ${caseTitle}` : ''}`.slice(0, 120),
      description: `Aus Behördenpost${caseTitle ? ` (Fall: ${caseTitle})` : ''}. Deadline: ${formatDeadlineDate(deadlineValue)}.`,
      fileName: `Frist_${deadlineValue}.ics`,
    })
  }

  return (
    <div className={`rounded-2xl border px-5 py-4 ${tone}`} role="status">
      <p className="text-sm font-medium opacity-80">{headline}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{formatDeadlineDate(deadlineValue)}</p>
      <p className="mt-1 text-sm leading-6 opacity-90">
        {deadlineLabel}
        {days !== null ? ` · ${formatDaysRemaining(days)}` : ''}
      </p>
      <button
        type="button"
        onClick={handleAddToCalendar}
        className={`mt-3 ${buttonStyles.secondary} !h-11 text-sm`}
      >
        In den Kalender legen
      </button>
    </div>
  )
}
