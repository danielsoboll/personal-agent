import type { FallakteEvent } from '@/lib/fallakteTypes'
import {
  FALLAKTE_RELATION_TYPE_BADGES,
  type FallakteRelation,
  type FallakteRelationType,
} from '@/lib/fallakteRelationTypes'
import { formatDeadlineDate, formatDeadlineShort } from '@/lib/deadlineDisplay'

export function eventSortKey(event: FallakteEvent): string {
  if (event.datePrecision === 'day' && event.eventDate) return event.eventDate
  return event.eventDateLabel?.trim() || ''
}

export function formatEventDateCompact(event: FallakteEvent): string {
  if (event.datePrecision === 'day' && event.eventDate) {
    return formatDeadlineShort(event.eventDate)
  }
  if (event.eventDateLabel?.trim()) return event.eventDateLabel.trim()
  return 'Datum unklar'
}

export function formatEventDateLong(event: FallakteEvent): string {
  if (event.datePrecision === 'day' && event.eventDate) {
    return formatDeadlineDate(event.eventDate)
  }
  if (event.eventDateLabel?.trim()) return event.eventDateLabel.trim()
  return 'Datum unklar'
}

/** Früher als das Quell-Event? (Datum, sonst createdAt) */
export function isEarlierEvent(candidate: FallakteEvent, fromEvent: FallakteEvent): boolean {
  const fromKey = eventSortKey(fromEvent)
  const candKey = eventSortKey(candidate)
  if (fromKey && candKey) {
    if (candKey < fromKey) return true
    if (candKey > fromKey) return false
  }
  return candidate.createdAt < fromEvent.createdAt
}

export function isConfirmedOrCorrected(event: FallakteEvent): boolean {
  return event.confirmationStatus === 'confirmed' || event.confirmationStatus === 'corrected'
}

/**
 * Bestätigte manuelle Relation — ohne „möglicherweise“.
 * Beispiel: Widerspricht dem Punkt „…“ vom 29.05.2024.
 */
export function formatConfirmedRelationSentence(
  relationType: FallakteRelationType,
  target: FallakteEvent,
): string {
  const title = target.title.trim()
  const date = formatEventDateCompact(target)

  switch (relationType) {
    case 'contradicts':
      return `Widerspricht dem Punkt „${title}“ vom ${date}.`
    case 'supplements':
      return `Ergänzt den Punkt „${title}“ vom ${date}.`
    case 'same_topic':
      return `Gehört zum selben Sachthema wie „${title}“ vom ${date}.`
    case 'replaces':
      return `Ersetzt den Punkt „${title}“ vom ${date}.`
    case 'answers':
      return `Beantwortet den Punkt „${title}“ vom ${date}.`
    case 'resolves':
      return `Erledigt den Punkt „${title}“ vom ${date}.`
    case 'confirms':
      return `Bestätigt den Punkt „${title}“ vom ${date}.`
    default:
      return `Bezieht sich auf: ${date} · ${title}`
  }
}

export function formatRelationCompactLine(
  relationType: FallakteRelationType,
  target: FallakteEvent,
): string {
  return `Bezieht sich auf: ${formatEventDateCompact(target)} · ${target.title.trim()}`
}

export function relationBadgeLabel(relationType: FallakteRelationType): string {
  return FALLAKTE_RELATION_TYPE_BADGES[relationType]
}

export type FallakteRelationView = {
  relation: FallakteRelation
  target: FallakteEvent | null
}

export function relationsForEvent(
  eventId: string,
  relations: FallakteRelation[],
  eventsById: Map<string, FallakteEvent>,
): FallakteRelationView[] {
  return relations
    .filter((relation) => relation.fromEventId === eventId && relation.status === 'confirmed')
    .map((relation) => ({
      relation,
      target: eventsById.get(relation.toEventId) ?? null,
    }))
    .sort((a, b) => a.relation.createdAt - b.relation.createdAt)
}
