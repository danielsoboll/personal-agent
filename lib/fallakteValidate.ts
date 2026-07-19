import { normalizePrimaryDeadline } from '@/lib/decisionFields'
import {
  FALLAKTE_EVENT_TYPES,
  FALLAKTE_SOURCE_TYPES,
  type FallakteAiFinding,
  type FallakteDatePrecision,
  type FallakteEventType,
  type FallakteFindingsPayload,
  type FallakteSourceType,
} from '@/lib/fallakteTypes'

const EVENT_TYPE_SET = new Set<string>(FALLAKTE_EVENT_TYPES)
const SOURCE_TYPE_SET = new Set<string>(FALLAKTE_SOURCE_TYPES)

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function normalizeDatePrecision(value: unknown): FallakteDatePrecision {
  if (typeof value !== 'string') return 'unknown'
  const key = value.trim().toLowerCase()
  if (key === 'day' || key === 'tag') return 'day'
  if (key === 'month' || key === 'monat') return 'month'
  if (key === 'year' || key === 'jahr') return 'year'
  return 'unknown'
}

function normalizeSourceType(value: unknown): FallakteSourceType | null {
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase()
  if (SOURCE_TYPE_SET.has(key)) return key as FallakteSourceType
  if (key.includes('explicit') || key.includes('ausdrück')) return 'explicit_document_fact'
  if (key.includes('deriv') || key.includes('ableit')) return 'derived'
  if (key.includes('infer') || key.includes('vermut')) return 'app_inferred'
  if (key.includes('user') || key.includes('nutzer')) return 'user_provided'
  return null
}

function normalizeEventType(value: unknown): FallakteEventType {
  if (typeof value !== 'string') return 'other'
  const key = value.trim().toLowerCase().replace(/-/g, '_')
  if (EVENT_TYPE_SET.has(key)) return key as FallakteEventType
  return 'other'
}

function clampConfidence(value: unknown): number {
  const num = asNullableNumber(value)
  if (num === null) return 0.5
  if (num > 1 && num <= 100) return Math.min(1, Math.max(0, num / 100))
  return Math.min(1, Math.max(0, num))
}

/**
 * Validiert und normalisiert KI-Findings.
 * Ungültige Einträge werden verworfen — nie ungeprüft speichern.
 */
export function validateFallakteFindings(raw: unknown): FallakteFindingsPayload {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { events: [] }
  }

  const eventsRaw = (raw as { events?: unknown }).events
  if (!Array.isArray(eventsRaw)) {
    return { events: [] }
  }

  const events: FallakteAiFinding[] = []

  for (const entry of eventsRaw.slice(0, 12)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue

    const row = entry as Record<string, unknown>
    const title = asTrimmedString(row.title)
    const description = asTrimmedString(row.description)
    if (!title || !description) continue

    const sourceType = normalizeSourceType(row.sourceType)
    if (!sourceType || sourceType === 'user_provided') {
      // KI darf keine „Nutzer“-Herkunft setzen
      if (!sourceType) continue
    }

    let datePrecision = normalizeDatePrecision(row.datePrecision)
    let eventDate = normalizePrimaryDeadline(row.eventDate) ?? null
    let eventDateLabel = asTrimmedString(row.eventDateLabel)

    // Kein erfundenes Tagesdatum bei Monat/Jahr/Unbekannt
    if (datePrecision !== 'day') {
      eventDate = null
    }
    if (datePrecision === 'day' && !eventDate) {
      datePrecision = 'unknown'
    }
    if (datePrecision === 'unknown' && !eventDateLabel) {
      eventDateLabel = null
    }
    if ((datePrecision === 'month' || datePrecision === 'year') && !eventDateLabel) {
      // Label fehlt → Datum unbrauchbar kennzeichnen
      datePrecision = 'unknown'
    }

    const relatedDeadline = normalizePrimaryDeadline(row.relatedDeadline) ?? null
    const sourcePage = asNullableNumber(row.sourcePage)
    const page =
      sourcePage !== null && sourcePage >= 1 && sourcePage <= 500 ? Math.round(sourcePage) : null

    const resolvedSource: FallakteSourceType =
      sourceType === 'user_provided' ? 'app_inferred' : sourceType

    events.push({
      eventType: normalizeEventType(row.eventType),
      eventDate,
      datePrecision,
      eventDateLabel,
      title: title.slice(0, 160),
      description: description.slice(0, 800),
      sourceType: resolvedSource,
      sourcePage: page,
      sourceExcerpt: asTrimmedString(row.sourceExcerpt)?.slice(0, 400) ?? null,
      confidence: clampConfidence(row.confidence),
      relatedDeadline,
      requiresUserConfirmation: row.requiresUserConfirmation !== false,
    })
  }

  return { events }
}
