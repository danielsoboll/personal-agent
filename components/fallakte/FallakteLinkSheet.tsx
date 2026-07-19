'use client'

import { useMemo, useState } from 'react'

import SheetPortal from '@/components/plus/SheetPortal'
import { buttonStyles } from '@/lib/buttonStyles'
import {
  formatEventDateCompact,
  isConfirmedOrCorrected,
  isEarlierEvent,
} from '@/lib/fallakteRelationDisplay'
import {
  FALLAKTE_RELATION_TYPE_LABELS,
  FALLAKTE_RELATION_TYPES_PRIMARY,
  FALLAKTE_RELATION_TYPES_SECONDARY,
  type FallakteRelation,
  type FallakteRelationType,
} from '@/lib/fallakteRelationTypes'
import type { FallakteEvent } from '@/lib/fallakteTypes'

type FallakteLinkSheetProps = {
  fromEvent: FallakteEvent
  allEvents: FallakteEvent[]
  /** Beim Bearbeiten vorausfüllen */
  editingRelation?: FallakteRelation | null
  onClose: () => void
  onSave: (payload: {
    toEventId: string
    relationType: FallakteRelationType
    topicLabel: string | null
    reason: string | null
  }) => void
}

export default function FallakteLinkSheet({
  fromEvent,
  allEvents,
  editingRelation = null,
  onClose,
  onSave,
}: FallakteLinkSheetProps) {
  const [showAll, setShowAll] = useState(false)
  const [selectedId, setSelectedId] = useState(editingRelation?.toEventId ?? '')
  const [relationType, setRelationType] = useState<FallakteRelationType>(
    editingRelation?.relationType ?? 'contradicts',
  )
  const [topicLabel, setTopicLabel] = useState(editingRelation?.topicLabel ?? '')
  const [reason, setReason] = useState(editingRelation?.reason ?? '')
  const [showSecondaryTypes, setShowSecondaryTypes] = useState(() =>
    editingRelation
      ? FALLAKTE_RELATION_TYPES_SECONDARY.includes(editingRelation.relationType)
      : false,
  )

  const candidates = useMemo(() => {
    const others = allEvents.filter((event) => event.id !== fromEvent.id)
    const filtered = showAll
      ? others
      : others.filter(
          (event) => isConfirmedOrCorrected(event) && isEarlierEvent(event, fromEvent),
        )
    return filtered.sort((a, b) => {
      const aKey = a.eventDate || a.eventDateLabel || ''
      const bKey = b.eventDate || b.eventDateLabel || ''
      if (aKey && bKey && aKey !== bKey) return bKey.localeCompare(aKey)
      return b.createdAt - a.createdAt
    })
  }, [allEvents, fromEvent, showAll])

  const canSave = Boolean(selectedId) && Boolean(relationType)

  return (
    <SheetPortal>
      <div className="fixed inset-0 z-50 flex flex-col bg-black/40" onClick={onClose} role="presentation">
        <div
          className="mt-auto max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
          onClick={(clickEvent) => clickEvent.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fallakte-link-title"
        >
          <h2 id="fallakte-link-title" className="text-lg font-semibold tracking-tight">
            {editingRelation ? 'Beziehung ändern' : 'Mit früherem Ereignis verknüpfen'}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Von: {formatEventDateCompact(fromEvent)} · {fromEvent.title}
          </p>

          <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(changeEvent) => setShowAll(changeEvent.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Alle Ereignisse anzeigen
          </label>

          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium">Zielereignis</p>
            {candidates.length === 0 ? (
              <p className="rounded-xl border border-border bg-background px-3 py-3 text-sm text-muted">
                {showAll
                  ? 'Keine anderen Ereignisse in diesem Fall.'
                  : 'Keine früheren bestätigten Ereignisse. Optional „Alle Ereignisse anzeigen“.'}
              </p>
            ) : (
              <ul className="max-h-56 space-y-2 overflow-y-auto">
                {candidates.map((event) => {
                  const selected = selectedId === event.id
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(event.id)}
                        className={`w-full rounded-xl border-2 px-3 py-2.5 text-left ${
                          selected
                            ? 'border-accent bg-accent-soft/50'
                            : 'border-border bg-background hover:border-accent/50'
                        }`}
                      >
                        <p className="text-xs font-semibold text-accent">
                          {formatEventDateCompact(event)}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold leading-5">{event.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted">
                          {event.description}
                        </p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Beziehungstyp</p>
            <div className="space-y-2">
              {FALLAKTE_RELATION_TYPES_PRIMARY.map((type) => (
                <label
                  key={type}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <input
                    type="radio"
                    name="relationType"
                    checked={relationType === type}
                    onChange={() => setRelationType(type)}
                  />
                  {FALLAKTE_RELATION_TYPE_LABELS[type]}
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowSecondaryTypes((value) => !value)}
              className="text-sm font-medium text-accent"
            >
              {showSecondaryTypes ? 'Weitere Beziehungstypen ausblenden' : 'Weitere Beziehungstypen'}
            </button>

            {showSecondaryTypes ? (
              <div className="space-y-2">
                {FALLAKTE_RELATION_TYPES_SECONDARY.map((type) => (
                  <label
                    key={type}
                    className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="relationType"
                      checked={relationType === type}
                      onChange={() => setRelationType(type)}
                    />
                    {FALLAKTE_RELATION_TYPE_LABELS[type]}
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          <label className="mt-4 block space-y-1.5">
            <span className="text-sm font-medium">Sachthema (optional)</span>
            <input
              value={topicLabel}
              onChange={(changeEvent) => setTopicLabel(changeEvent.target.value)}
              placeholder="z. B. Einkommenseinstufung / Kindesunterhalt"
              className="h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-base"
            />
          </label>

          <label className="mt-3 block space-y-1.5">
            <span className="text-sm font-medium">Kurze Begründung (optional)</span>
            <textarea
              value={reason}
              onChange={(changeEvent) => setReason(changeEvent.target.value)}
              rows={3}
              placeholder="Warum gehören die Ereignisse zusammen?"
              className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-base leading-6"
            />
          </label>

          <div className="mt-5 space-y-2">
            <button
              type="button"
              disabled={!canSave}
              onClick={() =>
                onSave({
                  toEventId: selectedId,
                  relationType,
                  topicLabel: topicLabel.trim() || null,
                  reason: reason.trim() || null,
                })
              }
              className={canSave ? buttonStyles.primaryActive : buttonStyles.primaryInactive}
            >
              Speichern
            </button>
            <button type="button" onClick={onClose} className={buttonStyles.secondary}>
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </SheetPortal>
  )
}
