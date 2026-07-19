'use client'

import { buttonStyles } from '@/lib/buttonStyles'
import {
  FALLAKTE_CONFIRMATION_LABELS,
  FALLAKTE_EVENT_TYPE_LABELS,
  FALLAKTE_SOURCE_TYPE_LABELS,
  type FallakteEvent,
} from '@/lib/fallakteTypes'
import { formatDeadlineDate } from '@/lib/deadlineDisplay'

type FallakteEventCardProps = {
  event: FallakteEvent
  busy?: boolean
  compactActions?: boolean
  onConfirm?: () => void
  onCorrect?: () => void
  onReject?: () => void
  onDefer?: () => void
  formatUploadDate: (timestamp: number) => string
}

function formatEventDateDisplay(event: FallakteEvent): string {
  if (event.datePrecision === 'day' && event.eventDate) {
    return formatDeadlineDate(event.eventDate)
  }
  if (event.eventDateLabel) return event.eventDateLabel
  return 'Datum unklar'
}

function sourceBadgeClass(event: FallakteEvent): string {
  if (event.confirmationStatus === 'confirmed' || event.confirmationStatus === 'corrected') {
    return 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
  }
  if (event.sourceType === 'app_inferred') {
    return 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100'
  }
  if (event.sourceType === 'derived') {
    return 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-100'
  }
  return 'border-border bg-surface text-foreground'
}

function statusBadgeClass(event: FallakteEvent): string {
  switch (event.confirmationStatus) {
    case 'confirmed':
    case 'corrected':
      return 'border-emerald-400 bg-emerald-100 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-50'
    case 'deferred':
      return 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
    case 'rejected':
      return 'border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100'
    default:
      return 'border-amber-400 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950/45 dark:text-amber-50'
  }
}

export default function FallakteEventCard({
  event,
  busy = false,
  compactActions = false,
  onConfirm,
  onCorrect,
  onReject,
  onDefer,
  formatUploadDate,
}: FallakteEventCardProps) {
  const showActions =
    !compactActions &&
    (event.confirmationStatus === 'pending' || event.confirmationStatus === 'deferred') &&
    (onConfirm || onCorrect || onReject || onDefer)

  const infoLabel =
    event.confirmationStatus === 'confirmed' || event.confirmationStatus === 'corrected'
      ? 'Vom Nutzer bestätigt'
      : FALLAKTE_SOURCE_TYPE_LABELS[event.sourceType]

  return (
    <article className="rounded-2xl border-2 border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-accent">{formatEventDateDisplay(event)}</p>
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold ${sourceBadgeClass(event)}`}
          >
            {infoLabel}
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold ${statusBadgeClass(event)}`}
          >
            {FALLAKTE_CONFIRMATION_LABELS[event.confirmationStatus]}
          </span>
        </div>
      </div>

      <h3 className="mt-2 text-base font-semibold leading-6 text-foreground">{event.title}</h3>
      <p className="mt-1 text-sm leading-6 text-foreground/90">{event.description}</p>

      <p className="mt-3 text-xs font-medium text-muted">
        {FALLAKTE_EVENT_TYPE_LABELS[event.eventType]}
      </p>

      {event.documentRef ? (
        <div className="mt-2 space-y-0.5 text-sm leading-6 text-foreground/80">
          <p>
            Quelle: {event.documentRef.fileName}
            {event.documentRef.documentDate
              ? ` · Dokumentdatum ${formatDeadlineDate(event.documentRef.documentDate)}`
              : ''}
          </p>
          <p className="text-xs text-muted">
            Hochgeladen am {formatUploadDate(event.documentRef.uploadedAt)}
          </p>
        </div>
      ) : null}

      {event.sourcePage || event.sourceExcerpt ? (
        <p className="mt-2 text-xs leading-5 text-muted">
          {event.sourcePage ? `Seite ${event.sourcePage}` : null}
          {event.sourcePage && event.sourceExcerpt ? ' · ' : null}
          {event.sourceExcerpt ? `„${event.sourceExcerpt}“` : null}
        </p>
      ) : null}

      {event.relatedDeadline ? (
        <p className="mt-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
          Frist: {formatDeadlineDate(event.relatedDeadline)}
          <span className="ml-1 text-xs font-medium text-muted">(bitte prüfen)</span>
        </p>
      ) : null}

      {event.datePrecision !== 'day' ? (
        <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-200">
          Datumsangabe unsicher ({event.datePrecision === 'month' ? 'nur Monat' : event.datePrecision === 'year' ? 'nur Jahr' : 'unklar'})
        </p>
      ) : null}

      {showActions ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={buttonStyles.accentSoft}
          >
            Stimmt
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCorrect}
            className={buttonStyles.secondary}
          >
            Korrigieren
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className={buttonStyles.dangerOutline}
          >
            Falsch erkannt
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDefer}
            className={buttonStyles.secondary}
          >
            Später prüfen
          </button>
        </div>
      ) : null}

      {compactActions &&
      (event.confirmationStatus === 'confirmed' || event.confirmationStatus === 'corrected') &&
      onCorrect ? (
        <div className="mt-4">
          <button
            type="button"
            disabled={busy}
            onClick={onCorrect}
            className={buttonStyles.secondary}
          >
            Korrigieren
          </button>
        </div>
      ) : null}
    </article>
  )
}
