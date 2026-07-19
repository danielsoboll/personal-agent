import { LOCAL_STORES, runLocalTransaction } from '@/lib/localDb'
import { getFallakteEvent } from '@/lib/localFallakte'
import {
  FALLAKTE_RELATION_TYPES,
  type FallakteRelation,
  type FallakteRelationCreateInput,
  type FallakteRelationType,
  type FallakteRelationUpdateInput,
} from '@/lib/fallakteRelationTypes'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `rel_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function isValidRelationType(value: string): value is FallakteRelationType {
  return (FALLAKTE_RELATION_TYPES as readonly string[]).includes(value)
}

export async function listFallakteRelations(caseId: string): Promise<FallakteRelation[]> {
  const all = await runLocalTransaction<FallakteRelation[]>(
    LOCAL_STORES.fallakteRelations,
    'readonly',
    (store) => {
      if (store.indexNames.contains('byCaseId')) {
        return store.index('byCaseId').getAll(caseId)
      }
      return store.getAll()
    },
  )
  return all
    .filter((relation) => relation.caseId === caseId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export async function getFallakteRelation(id: string): Promise<FallakteRelation | null> {
  const row = await runLocalTransaction<FallakteRelation | undefined>(
    LOCAL_STORES.fallakteRelations,
    'readonly',
    (store) => store.get(id),
  )
  return row ?? null
}

export async function saveFallakteRelation(relation: FallakteRelation): Promise<void> {
  await runLocalTransaction(LOCAL_STORES.fallakteRelations, 'readwrite', (store) =>
    store.put(relation),
  )
}

export async function deleteFallakteRelation(id: string): Promise<void> {
  await runLocalTransaction(LOCAL_STORES.fallakteRelations, 'readwrite', (store) =>
    store.delete(id),
  )
}

export async function deleteFallakteRelationsForCase(caseId: string): Promise<void> {
  const relations = await listFallakteRelations(caseId)
  await Promise.all(relations.map((relation) => deleteFallakteRelation(relation.id)))
}

/**
 * Manuelle Verknüpfung: status = confirmed, physisch speichern.
 * Bestehende Events bleiben unverändert.
 */
export async function createConfirmedFallakteRelation(
  input: FallakteRelationCreateInput,
): Promise<FallakteRelation> {
  if (input.fromEventId === input.toEventId) {
    throw new Error('Ein Ereignis kann nicht mit sich selbst verknüpft werden.')
  }
  if (!isValidRelationType(input.relationType)) {
    throw new Error('Ungültiger Beziehungstyp.')
  }

  const fromEvent = await getFallakteEvent(input.fromEventId)
  const toEvent = await getFallakteEvent(input.toEventId)
  if (!fromEvent || !toEvent) {
    throw new Error('Eines der Ereignisse wurde nicht gefunden.')
  }
  if (fromEvent.caseId !== input.caseId || toEvent.caseId !== input.caseId) {
    throw new Error('Beide Ereignisse müssen zum selben Fall gehören.')
  }
  if (fromEvent.caseId !== toEvent.caseId) {
    throw new Error('Ereignisse gehören zu unterschiedlichen Fällen.')
  }

  const existing = await listFallakteRelations(input.caseId)
  const duplicate = existing.find(
    (relation) =>
      relation.fromEventId === input.fromEventId &&
      relation.toEventId === input.toEventId &&
      relation.relationType === input.relationType &&
      relation.status !== 'rejected',
  )
  if (duplicate) {
    throw new Error('Diese Verknüpfung existiert bereits.')
  }

  const now = Date.now()
  const relation: FallakteRelation = {
    id: newId(),
    caseId: input.caseId,
    fromEventId: input.fromEventId,
    toEventId: input.toEventId,
    relationType: input.relationType,
    topicLabel: input.topicLabel?.trim() || null,
    status: 'confirmed',
    confidence: null,
    reason: input.reason?.trim() || null,
    originalAiData: null,
    createdAt: now,
    updatedAt: now,
  }
  await saveFallakteRelation(relation)
  return relation
}

export async function updateFallakteRelation(
  id: string,
  patch: FallakteRelationUpdateInput,
): Promise<FallakteRelation> {
  const existing = await getFallakteRelation(id)
  if (!existing) throw new Error('Verknüpfung nicht gefunden.')

  if (!isValidRelationType(patch.relationType)) {
    throw new Error('Ungültiger Beziehungstyp.')
  }

  const toEventId = patch.toEventId ?? existing.toEventId
  if (toEventId === existing.fromEventId) {
    throw new Error('Ein Ereignis kann nicht mit sich selbst verknüpft werden.')
  }

  const toEvent = await getFallakteEvent(toEventId)
  if (!toEvent || toEvent.caseId !== existing.caseId) {
    throw new Error('Zielereignis ungültig.')
  }

  const siblings = await listFallakteRelations(existing.caseId)
  const duplicate = siblings.find(
    (relation) =>
      relation.id !== id &&
      relation.fromEventId === existing.fromEventId &&
      relation.toEventId === toEventId &&
      relation.relationType === patch.relationType &&
      relation.status !== 'rejected',
  )
  if (duplicate) {
    throw new Error('Diese Verknüpfung existiert bereits.')
  }

  const next: FallakteRelation = {
    ...existing,
    toEventId,
    relationType: patch.relationType,
    topicLabel: patch.topicLabel === undefined ? existing.topicLabel : patch.topicLabel?.trim() || null,
    reason: patch.reason === undefined ? existing.reason : patch.reason?.trim() || null,
    status: existing.status === 'suggested' ? 'corrected' : existing.status,
    updatedAt: Date.now(),
  }
  await saveFallakteRelation(next)
  return next
}

/**
 * Manuelles Entfernen: physisches Löschen.
 * Begründung: keine Revisionshistorie für Relationen; Events bleiben unberührt.
 */
export async function removeFallakteRelation(id: string): Promise<void> {
  const existing = await getFallakteRelation(id)
  if (!existing) return
  await deleteFallakteRelation(id)
}
