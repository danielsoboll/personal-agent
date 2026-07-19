'use client'

import { useState } from 'react'

import FallakteRelationsBlock from '@/components/fallakte/FallakteRelationsBlock'
import {
  FALLAKTE_EVENT_TYPE_LABELS,
  FALLAKTE_SOURCE_TYPE_LABELS,
  type FallakteEvent,
} from '@/lib/fallakteTypes'
import type { FallakteRelationView } from '@/lib/fallakteRelationDisplay'
import type { FallakteRelation } from '@/lib/fallakteRelationTypes'
import { formatDeadlineDate } from '@/lib/deadlineDisplay'

type FallakteConfirmedEventRowProps = {
  event: FallakteEvent
  groupDateKey: string
  busy?: boolean
  relationViews?: FallakteRelationView[]
  onCorrect?: () => void
  onLink?: () => void
  onEditRelation?: (relation: FallakteRelation) => void
  onRemoveRelation?: (relation: FallakteRelation) => void
  formatUploadDate: (timestamp: number) => string
}

function divergentDateLabel(event: FallakteEvent, groupDateKey: string): string | null {
  if (groupDateKey === 'unknown') {
    return event.eventDateLabel?.trim() || null
  }
  if (event.datePrecision === 'day' && event.eventDate && event.eventDate !== groupDateKey) {
    return formatDeadlineDate(event.eventDate)
  }
  if (event.datePrecision !== 'day' && event.eventDateLabel) {
    return event.eventDateLabel
  }
  return null
}

export default function FallakteConfirmedEventRow({
  event,
  groupDateKey,
  busy = false,
  relationViews = [],
  onCorrect,
  onLink,
  onEditRelation,
  onRemoveRelation,
  formatUploadDate,
}: FallakteConfirmedEventRowProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const isCorrected = event.confirmationStatus === 'corrected'
  const dateHint = divergentDateLabel(event, groupDateKey)

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <div className="flex min-h-14 items-start gap-2 py-2.5">
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[0.7rem] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
          aria-hidden
        >
          ✓
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-800/90 dark:text-emerald-200/90">
            {isCorrected ? 'Bestätigt · korrigiert' : 'Bestätigt'}
          </p>
          <p className="line-clamp-2 text-sm font-medium leading-5 text-foreground/90">{event.title}</p>
          {dateHint ? <p className="mt-0.5 text-xs text-muted">{dateHint}</p> : null}

          <FallakteRelationsBlock
            views={relationViews}
            dense
            onEdit={onEditRelation}
            onRemove={onRemoveRelation}
          />

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <button
              type="button"
              onClick={() => setDetailsOpen((value) => !value)}
              className="inline-flex min-h-10 items-center py-1 text-sm font-medium text-accent"
            >
              {detailsOpen ? 'Details ausblenden' : 'Details'}
            </button>
            {onCorrect ? (
              <>
                <span className="text-muted/50" aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onCorrect}
                  className="inline-flex min-h-10 items-center py-1 text-sm font-medium text-accent"
                >
                  Ändern
                </button>
              </>
            ) : null}
            {onLink ? (
              <>
                <span className="text-muted/50" aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onLink}
                  className="inline-flex min-h-10 items-center py-1 text-sm font-medium text-accent"
                >
                  Verknüpfen
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {detailsOpen ? (
        <div className="mb-2.5 ml-7 space-y-1.5 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-xs leading-5 text-foreground/85 dark:bg-slate-950/30">
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">{event.description}</p>
          <p>Ereignistyp: {FALLAKTE_EVENT_TYPE_LABELS[event.eventType]}</p>
          <p>Informationsart: {FALLAKTE_SOURCE_TYPE_LABELS[event.sourceType]}</p>
          {event.documentRef?.fileName ? <p>Dokument: {event.documentRef.fileName}</p> : null}
          {event.documentRef?.documentDate ? (
            <p>Dokumentdatum: {formatDeadlineDate(event.documentRef.documentDate)}</p>
          ) : null}
          {event.documentRef ? (
            <p>Hochgeladen am {formatUploadDate(event.documentRef.uploadedAt)}</p>
          ) : null}
          {event.sourcePage ? <p>Seite: {event.sourcePage}</p> : null}
          {event.sourceExcerpt ? <p>Textausschnitt: „{event.sourceExcerpt}“</p> : null}
          {event.confidence !== null ? (
            <p>Vertrauensgrad: {Math.round(event.confidence * 100)}&nbsp;%</p>
          ) : null}
          {event.relatedDeadline ? (
            <p>Frist: {formatDeadlineDate(event.relatedDeadline)}</p>
          ) : null}
          {isCorrected ? (
            <>
              <p className="pt-1 font-medium text-foreground">Aktuelle (korrigierte) Fassung</p>
              <p>
                {event.title}
                {event.eventDate || event.eventDateLabel
                  ? ` · ${event.eventDate ? formatDeadlineDate(event.eventDate) : event.eventDateLabel}`
                  : ''}
              </p>
              {event.originalAiData ? (
                <p className="text-muted">Ursprüngliche KI-Erkennung vorhanden</p>
              ) : null}
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setDetailsOpen(false)}
            className="pt-1 text-sm font-medium text-accent"
          >
            Details ausblenden
          </button>
        </div>
      ) : null}
    </div>
  )
}
