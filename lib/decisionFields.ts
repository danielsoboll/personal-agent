import type {
  ContestablePoint,
  DocumentKind,
  DocumentsStatus,
  KeyClaim,
} from '@/lib/analyzeTypes'
import { ENABLE_REPLY_DRAFT } from '@/lib/featureFlags'

export const DOCUMENT_KIND_VALUES = [
  'behoerde',
  'gericht',
  'anwalt',
  'versicherung',
  'formular',
  'sonstiges',
] as const satisfies readonly DocumentKind[]

export const KEY_CLAIM_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    id: { type: 'string' as const },
    text: { type: 'string' as const },
  },
  required: ['id', 'text'],
}

export const CONTESTABLE_POINT_SCHEMA = {
  type: 'object' as const,
  additionalProperties: false,
  properties: {
    id: { type: 'string' as const },
    claim: { type: 'string' as const },
    why: { type: 'string' as const },
    suggestedAction: { type: 'string' as const },
  },
  required: ['id', 'claim', 'why', 'suggestedAction'],
}

/** OpenAI strict: optionale Felder = anyOf string|null, weiterhin in required. */
export const SCHEMA_OPTIONAL_STRING = {
  anyOf: [{ type: 'string' as const }, { type: 'null' as const }],
} as const

/**
 * Priority als freier String (kein Enum im Schema) — sonst bricht OpenAI,
 * wenn das Modell "" oder ein deutsches Extra-Wort liefert.
 * Normalisierung in normalizeStructuredSteps.
 */
export const SCHEMA_OPTIONAL_PRIORITY = {
  anyOf: [{ type: 'string' as const }, { type: 'null' as const }],
  description: 'hoch|mittel|niedrig oder null',
} as const

/** Gemeinsame Entscheidungsfelder für Analyze / Assess. */
export const DECISION_OUTPUT_PROPERTIES = {
  documentKind: {
    type: 'string' as const,
    description:
      'Dokumenttyp als Text: behoerde|gericht|anwalt|versicherung|formular|sonstiges (kein Umlaut, kleingeschrieben)',
  },
  primaryDeadline: {
    ...SCHEMA_OPTIONAL_STRING,
    description:
      'Wichtigste Frist wenn klar, bevorzugt YYYY-MM-DD; sonst null. Unklare Freitext-Fristen lieber null.',
  },
  primaryDeadlineLabel: {
    ...SCHEMA_OPTIONAL_STRING,
    description: 'Kurzes Fristen-Label (z. B. Einspruchsfrist), sonst null',
  },
  keyClaims: {
    type: 'array' as const,
    description:
      '0–3 Punkte: nur die wichtigsten Behauptungen/Forderungen bzw. bei Formularen kritische leere Felder (kurz)',
    items: KEY_CLAIM_SCHEMA,
  },
  contestablePoints: {
    type: 'array' as const,
    description:
      '0–3 Punkte: nur die wichtigsten Angriffspunkte bzw. bei Formularen bereits ausgefüllte Felder prüfen',
    items: CONTESTABLE_POINT_SCHEMA,
  },
  replyDraftRecommended: {
    type: 'boolean' as const,
    description:
      'Immer false — Antwortschreiben ist vorübergehend deaktiviert; später ggf. wieder aktivieren',
  },
} as const

export const DECISION_OUTPUT_REQUIRED = [
  'documentKind',
  'primaryDeadline',
  'primaryDeadlineLabel',
  'keyClaims',
  'contestablePoints',
  'replyDraftRecommended',
] as const

const DOCUMENT_KIND_ALIASES: Record<string, DocumentKind> = {
  behoerde: 'behoerde',
  behörde: 'behoerde',
  behorde: 'behoerde',
  authority: 'behoerde',
  amt: 'behoerde',
  gericht: 'gericht',
  court: 'gericht',
  anwalt: 'anwalt',
  lawyer: 'anwalt',
  rechtsanwalt: 'anwalt',
  versicherung: 'versicherung',
  insurance: 'versicherung',
  formular: 'formular',
  form: 'formular',
  antrag: 'formular',
  ausfuellbogen: 'formular',
  ausfüllbogen: 'formular',
  sonstiges: 'sonstiges',
  other: 'sonstiges',
  unknown: 'sonstiges',
}

export function normalizeDocumentKind(value: unknown): DocumentKind {
  if (typeof value !== 'string') return 'sonstiges'
  const key = value.trim().toLowerCase()
  if (!key) return 'sonstiges'
  if ((DOCUMENT_KIND_VALUES as readonly string[]).includes(key)) {
    return key as DocumentKind
  }
  return DOCUMENT_KIND_ALIASES[key] ?? 'sonstiges'
}

export function normalizeKeyClaims(claims: KeyClaim[] | undefined): KeyClaim[] {
  if (!Array.isArray(claims)) return []
  return claims
    .filter((claim) => claim?.text?.trim())
    .slice(0, 3)
    .map((claim, index) => ({
      id: claim.id?.trim() || `claim_${index + 1}`,
      text: claim.text.trim(),
    }))
}

export function normalizeContestablePoints(points: ContestablePoint[] | undefined): ContestablePoint[] {
  if (!Array.isArray(points)) return []
  return points
    .filter((point) => point?.claim?.trim() && point?.why?.trim())
    .slice(0, 3)
    .map((point, index) => ({
      id: point.id?.trim() || `punkt_${index + 1}`,
      claim: point.claim.trim(),
      why: point.why.trim(),
      suggestedAction: point.suggestedAction?.trim() || 'Genauer prüfen',
    }))
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function isValidYmd(year: number, month: number, day: number): boolean {
  if (year < 1990 || year > 2100) return false
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

/** Flexible Frist-Parsing: ISO, DE-Datum, sonst verwerfen. */
export function normalizePrimaryDeadline(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    const year = Number(iso[1])
    const month = Number(iso[2])
    const day = Number(iso[3])
    if (isValidYmd(year, month, day)) return `${year}-${pad2(month)}-${pad2(day)}`
    return undefined
  }

  const de = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/)
  if (de) {
    const day = Number(de[1])
    const month = Number(de[2])
    let year = Number(de[3])
    if (year < 100) year += year >= 70 ? 1900 : 2000
    if (isValidYmd(year, month, day)) return `${year}-${pad2(month)}-${pad2(day)}`
    return undefined
  }

  const deLong = trimmed.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/)
  if (deLong) {
    const day = Number(deLong[1])
    const month = Number(deLong[2])
    const year = Number(deLong[3])
    if (isValidYmd(year, month, day)) return `${year}-${pad2(month)}-${pad2(day)}`
  }

  return undefined
}

export function normalizeDocumentsStatus(value: unknown): DocumentsStatus | undefined {
  if (typeof value !== 'string') return undefined
  const key = value.trim().toLowerCase()
  if (key === 'not_needed' || key === 'none' || key === 'keine' || key === 'nicht_nötig' || key === 'nicht_noetig') {
    return 'not_needed'
  }
  if (
    key === 'recommended' ||
    key === 'empfohlen' ||
    key === 'sinnvoll' ||
    key === 'hilfreich' ||
    key === 'optional'
  ) {
    return 'recommended'
  }
  if (key === 'required' || key === 'nötig' || key === 'noetig' || key === 'pflicht' || key === 'fehlen') {
    return 'required'
  }
  return undefined
}

export function normalizeReviewPhase(value: unknown): 'interim' | 'final' | undefined {
  if (typeof value !== 'string') return undefined
  const key = value.trim().toLowerCase()
  if (key === 'final' || key === 'bewertung' || key === 'finale') return 'final'
  if (key === 'interim' || key === 'erste' || key === 'einordnung' || key === 'scan') return 'interim'
  return undefined
}

export function normalizeStepPriority(value: unknown): 'hoch' | 'mittel' | 'niedrig' | undefined {
  if (typeof value !== 'string') return undefined
  const key = value.trim().toLowerCase()
  if (key === 'hoch' || key === 'high' || key === 'dringend' || key === 'urgent') return 'hoch'
  if (key === 'mittel' || key === 'medium' || key === 'normal') return 'mittel'
  if (key === 'niedrig' || key === 'low' || key === 'spaeter' || key === 'später') return 'niedrig'
  return undefined
}

export function normalizeDecisionFields(payload: {
  documentKind?: unknown
  primaryDeadline?: unknown
  primaryDeadlineLabel?: unknown
  keyClaims?: KeyClaim[]
  contestablePoints?: ContestablePoint[]
  replyDraftRecommended?: unknown
}): {
  documentKind: DocumentKind
  primaryDeadline?: string
  primaryDeadlineLabel?: string
  keyClaims: KeyClaim[]
  contestablePoints: ContestablePoint[]
  replyDraftRecommended: boolean
} {
  const primaryDeadline = normalizePrimaryDeadline(payload.primaryDeadline)
  const primaryDeadlineLabel =
    typeof payload.primaryDeadlineLabel === 'string' ? payload.primaryDeadlineLabel.trim() : ''

  return {
    documentKind: normalizeDocumentKind(payload.documentKind),
    ...(primaryDeadline ? { primaryDeadline } : {}),
    ...(primaryDeadline && primaryDeadlineLabel ? { primaryDeadlineLabel } : {}),
    keyClaims: normalizeKeyClaims(payload.keyClaims),
    contestablePoints: normalizeContestablePoints(payload.contestablePoints),
    replyDraftRecommended: ENABLE_REPLY_DRAFT && payload.replyDraftRecommended === true,
  }
}
