'use client'

import FallakteConfirmedEventRow from '@/components/fallakte/FallakteConfirmedEventRow'
import FallakteEventCard from '@/components/fallakte/FallakteEventCard'
import {
  groupStatusSummary,
  sharedDocumentName,
  type FallakteDateGroup,
} from '@/lib/fallakteGroupByDate'
import type { FallakteEvent } from '@/lib/fallakteTypes'

type FallakteDateGroupCardProps = {
  group: FallakteDateGroup
  busyId: string | null
  onConfirm: (event: FallakteEvent) => void
  onCorrect: (event: FallakteEvent) => void
  onReject: (event: FallakteEvent) => void
  onDefer: (event: FallakteEvent) => void
  formatUploadDate: (timestamp: number) => string
}

function isConfirmedEvent(event: FallakteEvent): boolean {
  return event.confirmationStatus === 'confirmed' || event.confirmationStatus === 'corrected'
}

export default function FallakteDateGroupCard({
  group,
  busyId,
  onConfirm,
  onCorrect,
  onReject,
  onDefer,
  formatUploadDate,
}: FallakteDateGroupCardProps) {
  const sharedDoc = sharedDocumentName(group.events)
  const summary = groupStatusSummary(group.events)
  const confirmed = group.events.filter(isConfirmedEvent)
  const open = group.events.filter((event) => !isConfirmedEvent(event))

  const showConfirmedHeading = confirmed.length > 1 || (confirmed.length > 0 && open.length > 0)
  const showOpenHeading = open.length > 0 && confirmed.length > 0

  return (
    <div className="rounded-2xl border-2 border-border bg-surface p-3 shadow-sm sm:p-4">
      <header className="border-b border-border/70 pb-3">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">{group.displayDate}</h3>
        {sharedDoc ? (
          <p className="mt-1 truncate text-sm text-foreground/80">{sharedDoc}</p>
        ) : null}
        <p className="mt-1 text-xs font-medium text-muted">{summary}</p>
      </header>

      <div className="mt-3 space-y-4">
        {confirmed.length > 0 ? (
          <section>
            {showConfirmedHeading ? (
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-200/80">
                Bestätigt
              </h4>
            ) : null}
            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 px-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              {confirmed.map((event) => (
                <FallakteConfirmedEventRow
                  key={event.id}
                  event={event}
                  groupDateKey={group.dateKey}
                  busy={busyId === event.id}
                  onCorrect={() => onCorrect(event)}
                  formatUploadDate={formatUploadDate}
                />
              ))}
            </div>
          </section>
        ) : null}

        {open.length > 0 ? (
          <section>
            {showOpenHeading ? (
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-900/80 dark:text-amber-100/80">
                Noch zu prüfen
              </h4>
            ) : null}
            <ul className="space-y-2.5">
              {open.map((event) => (
                <li key={event.id}>
                  <FallakteEventCard
                    event={event}
                    busy={busyId === event.id}
                    hideDocumentName={Boolean(sharedDoc)}
                    onConfirm={() => onConfirm(event)}
                    onCorrect={() => onCorrect(event)}
                    onReject={() => onReject(event)}
                    onDefer={() => onDefer(event)}
                    formatUploadDate={formatUploadDate}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  )
}
