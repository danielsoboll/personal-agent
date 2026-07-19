'use client'

import { useState } from 'react'

import FallakteRelationsBlock from '@/components/fallakte/FallakteRelationsBlock'
import SheetPortal from '@/components/plus/SheetPortal'
import { buttonStyles } from '@/lib/buttonStyles'
import type { FallakteRelationView } from '@/lib/fallakteRelationDisplay'
import type { FallakteRelation } from '@/lib/fallakteRelationTypes'
import {
  FALLAKTE_CONFIRMATION_LABELS,
  FALLAKTE_EVENT_TYPE_LABELS,
  FALLAKTE_SOURCE_TYPE_LABELS,
  type FallakteEvent,
} from '@/lib/fallakteTypes'
import { formatDeadlineDate, formatDeadlineShort } from '@/lib/deadlineDisplay'

type FallakteEventCardProps = {
  event: FallakteEvent
  busy?: boolean
  hideDocumentName?: boolean
  readOnly?: boolean
  relationViews?: FallakteRelationView[]
  onConfirm?: () => void
  onCorrect?: () => void
  onReject?: () => void
  onDefer?: () => void
  onLink?: () => void
  onEditRelation?: (relation: FallakteRelation) => void
  onRemoveRelation?: (relation: FallakteRelation) => void
  formatUploadDate: (timestamp: number) => string
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

function shortStatusLabel(event: FallakteEvent): string {
  if (event.confirmationStatus === 'confirmed' || event.confirmationStatus === 'corrected') {
    return 'Bestätigt'
  }
  if (event.confirmationStatus === 'deferred') return 'Später prüfen'
  if (event.confirmationStatus === 'rejected') return 'Falsch erkannt'
  return 'Offen'
}

function compactSourceLine(event: FallakteEvent, hideDocumentName: boolean): string | null {
  const parts: string[] = []
  if (!hideDocumentName && event.documentRef) {
    if (event.documentRef.documentDate) {
      parts.push(`Schreiben vom ${formatDeadlineShort(event.documentRef.documentDate)}`)
    } else if (event.documentRef.fileName) {
      parts.push(event.documentRef.fileName)
    }
  }
  if (event.sourcePage) {
    parts.push(`Seite ${event.sourcePage}`)
  }
  if (parts.length === 0) {
    if (
      event.sourceType &&
      event.confirmationStatus !== 'confirmed' &&
      event.confirmationStatus !== 'corrected'
    ) {
      return FALLAKTE_SOURCE_TYPE_LABELS[event.sourceType]
    }
    return null
  }
  return `Quelle: ${parts.join(' · ')}`
}

const DESC_COLLAPSE_CHARS = 160

export default function FallakteEventCard({
  event,
  busy = false,
  hideDocumentName = false,
  readOnly = false,
  relationViews = [],
  onConfirm,
  onCorrect,
  onReject,
  onDefer,
  onLink,
  onEditRelation,
  onRemoveRelation,
  formatUploadDate,
}: FallakteEventCardProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)

  const needsReview =
    !readOnly &&
    (event.confirmationStatus === 'pending' || event.confirmationStatus === 'deferred')

  const description = event.description.trim()
  const descLong = description.length > DESC_COLLAPSE_CHARS
  const shownDescription =
    !descExpanded && descLong ? `${description.slice(0, DESC_COLLAPSE_CHARS).trim()}…` : description

  const sourceLine = compactSourceLine(event, hideDocumentName)
  const infoKindLabel = FALLAKTE_SOURCE_TYPE_LABELS[event.sourceType]

  return (
    <article className="rounded-xl border border-border bg-background/80 p-3 dark:bg-slate-900/40">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold ${statusBadgeClass(event)}`}
        >
          {shortStatusLabel(event)}
        </span>
        {!readOnly ? (
          <span className="rounded-full border border-border px-2 py-0.5 text-[0.7rem] font-medium text-muted">
            {infoKindLabel}
          </span>
        ) : null}
      </div>

      <h3 className="mt-2 text-[0.95rem] font-semibold leading-6 text-foreground">{event.title}</h3>
      {!readOnly || detailsOpen ? (
        <>
          <p className="mt-1 text-sm leading-6 text-foreground/90">{shownDescription}</p>
          {descLong && !readOnly ? (
            <button
              type="button"
              onClick={() => setDescExpanded((value) => !value)}
              className="mt-0.5 text-sm font-medium text-accent"
            >
              {descExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
            </button>
          ) : null}
        </>
      ) : null}

      {!readOnly ? (
        <>
          <p className="mt-2 text-xs font-medium text-muted">{FALLAKTE_EVENT_TYPE_LABELS[event.eventType]}</p>
          {sourceLine ? <p className="mt-1 text-xs leading-5 text-muted">{sourceLine}</p> : null}
        </>
      ) : null}

      {!readOnly ? (
        <FallakteRelationsBlock
          views={relationViews}
          onEdit={onEditRelation}
          onRemove={onRemoveRelation}
        />
      ) : null}

      {detailsOpen ? (
        <div className="mt-3 space-y-1.5 rounded-lg border border-border/80 bg-surface px-3 py-2.5 text-xs leading-5 text-foreground/85">
          <p className="whitespace-pre-wrap text-sm leading-6">{event.description}</p>
          {event.documentRef?.fileName ? <p>Dokument: {event.documentRef.fileName}</p> : null}
          {event.documentRef?.documentDate ? (
            <p>Dokumentdatum: {formatDeadlineDate(event.documentRef.documentDate)}</p>
          ) : null}
          {event.documentRef ? (
            <p>Hochgeladen am {formatUploadDate(event.documentRef.uploadedAt)}</p>
          ) : null}
          {event.sourcePage ? <p>Seite: {event.sourcePage}</p> : null}
          {event.sourceExcerpt ? <p>Textausschnitt: „{event.sourceExcerpt}“</p> : null}
          <p>Informationsart: {FALLAKTE_SOURCE_TYPE_LABELS[event.sourceType]}</p>
          <p>Ereignistyp: {FALLAKTE_EVENT_TYPE_LABELS[event.eventType]}</p>
          {event.confidence !== null ? (
            <p>Vertrauensgrad: {Math.round(event.confidence * 100)}&nbsp;%</p>
          ) : null}
          {event.relatedDeadline ? (
            <p>Frist: {formatDeadlineDate(event.relatedDeadline)} (bitte prüfen)</p>
          ) : null}
          <p>Status: {FALLAKTE_CONFIRMATION_LABELS[event.confirmationStatus]}</p>
          <button
            type="button"
            onClick={() => setDetailsOpen(false)}
            className="pt-1 text-sm font-medium text-accent"
          >
            Details ausblenden
          </button>
        </div>
      ) : null}

      {needsReview ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`${buttonStyles.accentSoft} h-11 min-h-11 flex-1 px-2 text-sm`}
          >
            Stimmt
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCorrect}
            className={`${buttonStyles.secondary} h-11 min-h-11 flex-1 px-2 text-sm`}
          >
            Ändern
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setMoreOpen(true)}
            className={`${buttonStyles.secondary} h-11 min-h-11 flex-1 px-2 text-sm`}
          >
            Mehr
          </button>
        </div>
      ) : null}

      {readOnly && !detailsOpen ? (
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="mt-2 text-sm font-medium text-accent"
        >
          Details
        </button>
      ) : null}

      {moreOpen ? (
        <SheetPortal>
          <div
            className="fixed inset-0 z-50 flex flex-col bg-black/40"
            onClick={() => setMoreOpen(false)}
            role="presentation"
          >
            <div
              className="mt-auto w-full space-y-2 rounded-t-3xl border-t border-border bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
              onClick={(clickEvent) => clickEvent.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`fallakte-more-${event.id}`}
            >
              <h2 id={`fallakte-more-${event.id}`} className="text-base font-semibold tracking-tight">
                Weitere Aktionen
              </h2>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setMoreOpen(false)
                  onDefer?.()
                }}
                className={buttonStyles.secondary}
              >
                Später prüfen
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setMoreOpen(false)
                  onReject?.()
                }}
                className={buttonStyles.dangerOutline}
              >
                Falsch erkannt
              </button>
              {onLink ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setMoreOpen(false)
                    onLink()
                  }}
                  className={buttonStyles.secondary}
                >
                  Mit früherem Ereignis verknüpfen
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setMoreOpen(false)
                  setDetailsOpen(true)
                }}
                className={buttonStyles.secondary}
              >
                Details anzeigen
              </button>
              {!detailsOpen && (event.sourceExcerpt || event.documentRef) ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setMoreOpen(false)
                    setDetailsOpen(true)
                  }}
                  className={buttonStyles.secondary}
                >
                  Quelle vollständig anzeigen
                </button>
              ) : null}
              <button type="button" onClick={() => setMoreOpen(false)} className={buttonStyles.secondary}>
                Schließen
              </button>
            </div>
          </div>
        </SheetPortal>
      ) : null}
    </article>
  )
}
