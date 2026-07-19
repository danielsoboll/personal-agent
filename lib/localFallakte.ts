import { LOCAL_STORES, runLocalTransaction } from '@/lib/localDb'
import {
  FALLAKTE_SOURCE_TYPE_LABELS,
  type FallakteConfirmationStatus,
  type FallakteDocumentRef,
  type FallakteEvent,
  type FallakteEventEditable,
  type FallakteFindingsPayload,
} from '@/lib/fallakteTypes'

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export async function listFallakteEvents(caseId: string): Promise<FallakteEvent[]> {
  const all = await runLocalTransaction<FallakteEvent[]>(LOCAL_STORES.fallakteEvents, 'readonly', (store) => {
    if (store.indexNames.contains('byCaseId')) {
      return store.index('byCaseId').getAll(caseId)
    }
    return store.getAll()
  })
  const scoped = storeHasCaseFilter(all, caseId)
  return scoped.sort((a, b) => {
    const aKey = a.eventDate || a.eventDateLabel || ''
    const bKey = b.eventDate || b.eventDateLabel || ''
    if (aKey && bKey && aKey !== bKey) return aKey.localeCompare(bKey)
    return a.createdAt - b.createdAt
  })
}

function storeHasCaseFilter(all: FallakteEvent[], caseId: string): FallakteEvent[] {
  return all.filter((event) => event.caseId === caseId)
}

export async function getFallakteEvent(id: string): Promise<FallakteEvent | null> {
  const row = await runLocalTransaction<FallakteEvent | undefined>(
    LOCAL_STORES.fallakteEvents,
    'readonly',
    (store) => store.get(id),
  )
  return row ?? null
}

export async function saveFallakteEvent(event: FallakteEvent): Promise<void> {
  await runLocalTransaction(LOCAL_STORES.fallakteEvents, 'readwrite', (store) => store.put(event))
}

export async function deleteFallakteEventsForCase(caseId: string): Promise<void> {
  const events = await listFallakteEvents(caseId)
  await Promise.all(events.map((event) => deleteFallakteEvent(event.id)))
}

async function deleteFallakteEvent(id: string): Promise<void> {
  await runLocalTransaction(LOCAL_STORES.fallakteEvents, 'readwrite', (store) => store.delete(id))
}

/** Speichert validierte KI-Findings als pending Events. */
export async function persistFallakteFindings(options: {
  caseId: string
  findings: FallakteFindingsPayload
  documentRefs: FallakteDocumentRef[]
  analysisBatchId: string
}): Promise<FallakteEvent[]> {
  const now = Date.now()
  const primaryRef = options.documentRefs[0] ?? null
  const created: FallakteEvent[] = []

  for (const finding of options.findings.events) {
    const event: FallakteEvent = {
      id: newId(),
      caseId: options.caseId,
      documentRef: primaryRef
        ? {
            ...primaryRef,
            documentDate: finding.eventDate ?? primaryRef.documentDate,
          }
        : null,
      eventType: finding.eventType,
      eventDate: finding.eventDate,
      datePrecision: finding.datePrecision,
      eventDateLabel: finding.eventDateLabel,
      title: finding.title,
      description: finding.description,
      sourceType: finding.sourceType,
      sourcePage: finding.sourcePage,
      sourceExcerpt: finding.sourceExcerpt,
      confidence: finding.confidence,
      relatedDeadline: finding.relatedDeadline,
      confirmationStatus: 'pending',
      confirmedAt: null,
      originalAiData: { ...finding } as unknown as Record<string, unknown>,
      correctedData: null,
      rejectionReason: null,
      analysisBatchId: options.analysisBatchId,
      createdAt: now,
      updatedAt: now,
    }
    await saveFallakteEvent(event)
    created.push(event)
  }

  return created
}

export async function confirmFallakteEvent(id: string): Promise<FallakteEvent> {
  const existing = await getFallakteEvent(id)
  if (!existing) throw new Error('Ereignis nicht gefunden.')
  const now = Date.now()
  const next: FallakteEvent = {
    ...existing,
    confirmationStatus: 'confirmed',
    confirmedAt: now,
    updatedAt: now,
  }
  await saveFallakteEvent(next)
  return next
}

export async function deferFallakteEvent(id: string): Promise<FallakteEvent> {
  const existing = await getFallakteEvent(id)
  if (!existing) throw new Error('Ereignis nicht gefunden.')
  const next: FallakteEvent = {
    ...existing,
    confirmationStatus: 'deferred',
    updatedAt: Date.now(),
  }
  await saveFallakteEvent(next)
  return next
}

export async function rejectFallakteEvent(id: string, reason?: string): Promise<FallakteEvent> {
  const existing = await getFallakteEvent(id)
  if (!existing) throw new Error('Ereignis nicht gefunden.')
  const next: FallakteEvent = {
    ...existing,
    confirmationStatus: 'rejected',
    rejectionReason: reason?.trim() || null,
    updatedAt: Date.now(),
  }
  await saveFallakteEvent(next)
  return next
}

export async function correctFallakteEvent(
  id: string,
  edits: FallakteEventEditable,
): Promise<FallakteEvent> {
  const existing = await getFallakteEvent(id)
  if (!existing) throw new Error('Ereignis nicht gefunden.')
  const now = Date.now()
  const next: FallakteEvent = {
    ...existing,
    eventType: edits.eventType,
    eventDate: edits.datePrecision === 'day' ? edits.eventDate : null,
    datePrecision: edits.datePrecision,
    eventDateLabel: edits.eventDateLabel,
    title: edits.title.trim(),
    description: edits.description.trim(),
    relatedDeadline: edits.relatedDeadline,
    confirmationStatus: 'corrected',
    confirmedAt: now,
    correctedData: edits,
    updatedAt: now,
  }
  await saveFallakteEvent(next)
  return next
}

export function displaySourceBadge(
  event: FallakteEvent,
): { kind: 'source' | 'confirmed'; label: string } {
  if (event.confirmationStatus === 'confirmed' || event.confirmationStatus === 'corrected') {
    return { kind: 'confirmed', label: 'Vom Nutzer bestätigt' }
  }
  return { kind: 'source', label: FALLAKTE_SOURCE_TYPE_LABELS[event.sourceType] }
}

export function isActiveTimelineStatus(status: FallakteConfirmationStatus): boolean {
  return status !== 'rejected'
}
