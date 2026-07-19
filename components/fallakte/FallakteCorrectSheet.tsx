'use client'

import { useState } from 'react'

import SheetPortal from '@/components/plus/SheetPortal'
import { buttonStyles } from '@/lib/buttonStyles'
import {
  FALLAKTE_EVENT_TYPES,
  FALLAKTE_EVENT_TYPE_LABELS,
  type FallakteDatePrecision,
  type FallakteEvent,
  type FallakteEventEditable,
  type FallakteEventType,
} from '@/lib/fallakteTypes'

type FallakteCorrectSheetProps = {
  event: FallakteEvent
  onClose: () => void
  onSave: (edits: FallakteEventEditable) => void
}

export default function FallakteCorrectSheet({ event, onClose, onSave }: FallakteCorrectSheetProps) {
  const [eventType, setEventType] = useState<FallakteEventType>(event.eventType)
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description)
  const [datePrecision, setDatePrecision] = useState<FallakteDatePrecision>(event.datePrecision)
  const [eventDate, setEventDate] = useState(event.eventDate ?? '')
  const [eventDateLabel, setEventDateLabel] = useState(event.eventDateLabel ?? '')
  const [relatedDeadline, setRelatedDeadline] = useState(event.relatedDeadline ?? '')

  const canSave = title.trim().length > 0 && description.trim().length > 0

  return (
    <SheetPortal>
      <div className="fixed inset-0 z-50 flex flex-col bg-black/40" onClick={onClose} role="presentation">
        <div
          className="mt-auto max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
          onClick={(eventClick) => eventClick.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fallakte-correct-title"
        >
          <h2 id="fallakte-correct-title" className="text-lg font-semibold tracking-tight">
            Ereignis korrigieren
          </h2>
          <p className="mt-1 text-sm text-muted">
            Die ursprüngliche KI-Erkennung bleibt gespeichert.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Titel</span>
              <input
                value={title}
                onChange={(eventChange) => setTitle(eventChange.target.value)}
                className="h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-base"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Beschreibung</span>
              <textarea
                value={description}
                onChange={(eventChange) => setDescription(eventChange.target.value)}
                rows={4}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2 text-base leading-6"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Ereignistyp</span>
              <select
                value={eventType}
                onChange={(eventChange) => setEventType(eventChange.target.value as FallakteEventType)}
                className="h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-base"
              >
                {FALLAKTE_EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {FALLAKTE_EVENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Datumsgenauigkeit</span>
              <select
                value={datePrecision}
                onChange={(eventChange) =>
                  setDatePrecision(eventChange.target.value as FallakteDatePrecision)
                }
                className="h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-base"
              >
                <option value="day">Genauer Tag</option>
                <option value="month">Nur Monat</option>
                <option value="year">Nur Jahr</option>
                <option value="unknown">Unklar</option>
              </select>
            </label>

            {datePrecision === 'day' ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Datum</span>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(eventChange) => setEventDate(eventChange.target.value)}
                  className="h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-base"
                />
              </label>
            ) : (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Datumsanzeige</span>
                <input
                  value={eventDateLabel}
                  onChange={(eventChange) => setEventDateLabel(eventChange.target.value)}
                  placeholder="z. B. März 2026"
                  className="h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-base"
                />
              </label>
            )}

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Mögliche Frist (optional)</span>
              <input
                type="date"
                value={relatedDeadline}
                onChange={(eventChange) => setRelatedDeadline(eventChange.target.value)}
                className="h-12 w-full rounded-xl border-2 border-border bg-background px-3 text-base"
              />
            </label>
          </div>

          <div className="mt-5 space-y-2">
            <button
              type="button"
              disabled={!canSave}
              onClick={() =>
                onSave({
                  eventType,
                  title: title.trim(),
                  description: description.trim(),
                  datePrecision,
                  eventDate: datePrecision === 'day' && eventDate ? eventDate : null,
                  eventDateLabel:
                    datePrecision === 'day' ? null : eventDateLabel.trim() || null,
                  relatedDeadline: relatedDeadline || null,
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
