import type {
  ContestablePoint,
  DocumentKind,
  KeyClaim,
} from '@/lib/analyzeTypes'

export const DOCUMENT_KIND_VALUES = [
  'behoerde',
  'gericht',
  'anwalt',
  'versicherung',
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

export const SCHEMA_OPTIONAL_PRIORITY = {
  anyOf: [
    { type: 'string' as const, enum: ['hoch', 'mittel', 'niedrig'] },
    { type: 'null' as const },
  ],
} as const

/** Gemeinsame Entscheidungsfelder für Analyze / Assess. */
export const DECISION_OUTPUT_PROPERTIES = {
  documentKind: {
    type: 'string' as const,
    enum: [...DOCUMENT_KIND_VALUES],
    description: 'Dokumenttyp für Playbook und UI',
  },
  primaryDeadline: {
    ...SCHEMA_OPTIONAL_STRING,
    description: 'Wichtigste Frist als ISO-Datum, sonst null',
  },
  primaryDeadlineLabel: {
    ...SCHEMA_OPTIONAL_STRING,
    description: 'Kurzes Fristen-Label, sonst null',
  },
  keyClaims: {
    type: 'array' as const,
    description: 'Wesentliche Behauptungen/Forderungen der Gegenseite oder des Absenders (0–6)',
    items: KEY_CLAIM_SCHEMA,
  },
  contestablePoints: {
    type: 'array' as const,
    description: 'Prüf-/Angriffspunkte mit kurzem Warum und vorgeschlagener Handlung (0–6)',
    items: CONTESTABLE_POINT_SCHEMA,
  },
} as const

export const DECISION_OUTPUT_REQUIRED = [
  'documentKind',
  'primaryDeadline',
  'primaryDeadlineLabel',
  'keyClaims',
  'contestablePoints',
] as const

export function normalizeDocumentKind(value: unknown): DocumentKind {
  if (typeof value === 'string' && (DOCUMENT_KIND_VALUES as readonly string[]).includes(value)) {
    return value as DocumentKind
  }
  return 'sonstiges'
}

export function normalizeKeyClaims(claims: KeyClaim[] | undefined): KeyClaim[] {
  if (!Array.isArray(claims)) return []
  return claims
    .filter((claim) => claim?.text?.trim())
    .slice(0, 6)
    .map((claim, index) => ({
      id: claim.id?.trim() || `claim_${index + 1}`,
      text: claim.text.trim(),
    }))
}

export function normalizeContestablePoints(points: ContestablePoint[] | undefined): ContestablePoint[] {
  if (!Array.isArray(points)) return []
  return points
    .filter((point) => point?.claim?.trim() && point?.why?.trim())
    .slice(0, 6)
    .map((point, index) => ({
      id: point.id?.trim() || `punkt_${index + 1}`,
      claim: point.claim.trim(),
      why: point.why.trim(),
      suggestedAction: point.suggestedAction?.trim() || 'Genauer prüfen',
    }))
}

export function normalizePrimaryDeadline(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined
  return trimmed
}

export function normalizeDecisionFields(payload: {
  documentKind?: unknown
  primaryDeadline?: unknown
  primaryDeadlineLabel?: unknown
  keyClaims?: KeyClaim[]
  contestablePoints?: ContestablePoint[]
}): {
  documentKind: DocumentKind
  primaryDeadline?: string
  primaryDeadlineLabel?: string
  keyClaims: KeyClaim[]
  contestablePoints: ContestablePoint[]
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
  }
}
