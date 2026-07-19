import { createId } from '@/lib/createId'
import {
  roleFromAnalyzeIntent,
  type CaseDocument,
  type CaseDocumentRole,
} from '@/lib/caseDocumentTypes'
import { LOCAL_STORES, runLocalTransaction } from '@/lib/localDb'
import type { AnalyzeIntent } from '@/lib/analyzeTypes'

function newId(): string {
  return createId()
}

export async function listCaseDocuments(caseId: string): Promise<CaseDocument[]> {
  const all = await runLocalTransaction<CaseDocument[]>(LOCAL_STORES.caseDocuments, 'readonly', (store) => {
    if (store.indexNames.contains('byCaseId')) {
      return store.index('byCaseId').getAll(caseId)
    }
    return store.getAll()
  })
  return all
    .filter((doc) => doc.caseId === caseId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export async function getCaseDocument(id: string): Promise<CaseDocument | null> {
  const row = await runLocalTransaction<CaseDocument | undefined>(
    LOCAL_STORES.caseDocuments,
    'readonly',
    (store) => store.get(id),
  )
  return row ?? null
}

export async function saveCaseDocument(doc: CaseDocument): Promise<void> {
  await runLocalTransaction(LOCAL_STORES.caseDocuments, 'readwrite', (store) => store.put(doc))
}

export async function deleteCaseDocumentsForCase(caseId: string): Promise<void> {
  const docs = await listCaseDocuments(caseId)
  await Promise.all(
    docs.map((doc) =>
      runLocalTransaction(LOCAL_STORES.caseDocuments, 'readwrite', (store) => store.delete(doc.id)),
    ),
  )
}

export async function demoteCurrentDocuments(caseId: string, exceptId?: string): Promise<void> {
  const docs = await listCaseDocuments(caseId)
  const now = Date.now()
  for (const doc of docs) {
    if (doc.role !== 'current') continue
    if (exceptId && doc.id === exceptId) continue
    await saveCaseDocument({
      ...doc,
      role: 'historical',
      supersededAt: now,
      updatedAt: now,
    })
  }
}

type PhotoLike = {
  fileName?: string
  kind?: 'image' | 'pdf'
  mimeType?: string
  blob: Blob
  createdAt?: number
}

/** Speichert Scan-Fotos dauerhaft und setzt bei Bedarf currentDocumentId-Logik über Rückgabe. */
export async function persistPhotosAsCaseDocuments(options: {
  caseId: string
  photos: PhotoLike[]
  intent: AnalyzeIntent
  analysisBatchId: string
  setAsCurrent: boolean
}): Promise<CaseDocument[]> {
  const now = Date.now()
  const role: CaseDocumentRole = options.setAsCurrent
    ? 'current'
    : roleFromAnalyzeIntent(options.intent === 'final' ? 'initial' : options.intent)

  if (options.setAsCurrent) {
    await demoteCurrentDocuments(options.caseId)
  }

  const created: CaseDocument[] = []
  for (const photo of options.photos) {
    const kind = photo.kind === 'pdf' ? 'pdf' : 'image'
    const doc: CaseDocument = {
      id: newId(),
      caseId: options.caseId,
      role,
      fileName: photo.fileName || (kind === 'pdf' ? 'Dokument.pdf' : 'Foto.jpg'),
      kind,
      mimeType: photo.mimeType || photo.blob.type || undefined,
      blob: photo.blob,
      createdAt: photo.createdAt || now,
      updatedAt: now,
      sourceAnalysisBatchId: options.analysisBatchId,
      supersededAt: null,
    }
    await saveCaseDocument(doc)
    created.push(doc)
  }

  return created
}

export async function setDocumentRole(documentId: string, role: CaseDocumentRole): Promise<CaseDocument> {
  const existing = await getCaseDocument(documentId)
  if (!existing) throw new Error('Dokument nicht gefunden.')
  const updated: CaseDocument = {
    ...existing,
    role,
    updatedAt: Date.now(),
    supersededAt: role === 'current' ? null : existing.supersededAt,
  }
  await saveCaseDocument(updated)
  return updated
}
