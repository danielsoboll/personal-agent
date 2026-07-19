/** Beziehungstypen zwischen Fallakte-Ereignissen (IndexedDB, lokal). */

export const FALLAKTE_RELATION_TYPES = [
  'same_topic',
  'contradicts',
  'supplements',
  'replaces',
  'answers',
  'resolves',
  'confirms',
] as const

export type FallakteRelationType = (typeof FALLAKTE_RELATION_TYPES)[number]

/** Primär in der UI anbieten */
export const FALLAKTE_RELATION_TYPES_PRIMARY: FallakteRelationType[] = [
  'same_topic',
  'contradicts',
  'supplements',
]

/** Unter „Weitere Beziehungstypen“ */
export const FALLAKTE_RELATION_TYPES_SECONDARY: FallakteRelationType[] = [
  'replaces',
  'answers',
  'resolves',
  'confirms',
]

export const FALLAKTE_RELATION_TYPE_LABELS: Record<FallakteRelationType, string> = {
  same_topic: 'Gehört zum selben Sachthema',
  contradicts: 'Widerspricht',
  supplements: 'Ergänzt',
  replaces: 'Ersetzt',
  answers: 'Beantwortet',
  resolves: 'Erledigt',
  confirms: 'Bestätigt',
}

/** Kurze Badge-Labels */
export const FALLAKTE_RELATION_TYPE_BADGES: Record<FallakteRelationType, string> = {
  same_topic: 'gleiches Sachthema',
  contradicts: 'widerspricht',
  supplements: 'ergänzt',
  replaces: 'ersetzt',
  answers: 'beantwortet',
  resolves: 'erledigt',
  confirms: 'bestätigt',
}

export const FALLAKTE_RELATION_STATUSES = [
  'suggested',
  'confirmed',
  'rejected',
  'corrected',
] as const

export type FallakteRelationStatus = (typeof FALLAKTE_RELATION_STATUSES)[number]

export type FallakteRelation = {
  id: string
  caseId: string
  /** Späteres / aktuelles Ereignis */
  fromEventId: string
  /** Früheres Bezugsereignis */
  toEventId: string
  relationType: FallakteRelationType
  topicLabel: string | null
  status: FallakteRelationStatus
  confidence: number | null
  reason: string | null
  originalAiData: Record<string, unknown> | null
  createdAt: number
  updatedAt: number
}

export type FallakteRelationCreateInput = {
  caseId: string
  fromEventId: string
  toEventId: string
  relationType: FallakteRelationType
  topicLabel?: string | null
  reason?: string | null
}

export type FallakteRelationUpdateInput = {
  relationType: FallakteRelationType
  topicLabel?: string | null
  reason?: string | null
  toEventId?: string
}
