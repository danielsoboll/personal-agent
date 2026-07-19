import type { FallakteEvent } from '@/lib/fallakteTypes'
import { formatDeadlineDate } from '@/lib/deadlineDisplay'

export type FallakteDateGroup = {
  dateKey: string
  displayDate: string
  events: FallakteEvent[]
}

const UNKNOWN_KEY = 'unknown'

function eventDateKey(event: FallakteEvent): string {
  if (event.datePrecision === 'day' && event.eventDate) {
    return event.eventDate
  }
  return UNKNOWN_KEY
}

function displayDateForKey(dateKey: string): string {
  if (dateKey === UNKNOWN_KEY) return 'Datum noch unklar'
  return formatDeadlineDate(dateKey)
}

/**
 * Nur Frontend-Gruppierung — keine Persistenz, keine Deduplizierung.
 * Neueste Datumsgruppe zuerst; unsichere Daten am Ende.
 */
export function groupEventsByDate(events: FallakteEvent[]): FallakteDateGroup[] {
  const buckets = new Map<string, FallakteEvent[]>()

  for (const event of events) {
    const key = eventDateKey(event)
    const list = buckets.get(key)
    if (list) list.push(event)
    else buckets.set(key, [event])
  }

  for (const list of buckets.values()) {
    list.sort((a, b) => a.createdAt - b.createdAt)
  }

  const keys = [...buckets.keys()].sort((a, b) => {
    if (a === UNKNOWN_KEY) return 1
    if (b === UNKNOWN_KEY) return -1
    return b.localeCompare(a)
  })

  return keys.map((dateKey) => {
    const groupEvents = buckets.get(dateKey) ?? []
    return {
      dateKey,
      displayDate: displayDateForKey(dateKey),
      events: groupEvents,
    }
  })
}

export function sharedDocumentName(events: FallakteEvent[]): string | null {
  const names = events
    .map((event) => event.documentRef?.fileName?.trim())
    .filter((name): name is string => Boolean(name))
  if (names.length === 0 || names.length !== events.length) return null
  const first = names[0]
  return names.every((name) => name === first) ? first : null
}

export function groupStatusSummary(events: FallakteEvent[]): string {
  const total = events.length
  const confirmed = events.filter(
    (event) =>
      event.confirmationStatus === 'confirmed' || event.confirmationStatus === 'corrected',
  ).length
  const open = events.filter(
    (event) =>
      event.confirmationStatus === 'pending' || event.confirmationStatus === 'deferred',
  ).length

  if (total === 0) return ''
  if (confirmed === total) {
    return total === 1 ? '1 Punkt · vollständig bestätigt' : `${total} Punkte · vollständig bestätigt`
  }

  const parts = [
    total === 1 ? '1 erkannter Punkt' : `${total} erkannte Punkte`,
    `${confirmed} bestätigt`,
    `${open} offen`,
  ]
  return parts.join(' · ')
}
