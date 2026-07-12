import { createId } from '@/lib/createId'
import { LOCAL_STORES, runLocalTransaction } from '@/lib/localDb'

export type LibraryDocument = {
  id: string
  caseId: string
  caseTitle: string
  stepId: string
  stepText: string
  title: string
  previewText: string
  fileName: string
  mimeType: string
  blob: Blob
  createdAt: number
}

export type LibraryDocumentSummary = Pick<
  LibraryDocument,
  'id' | 'caseId' | 'caseTitle' | 'title' | 'stepText' | 'previewText' | 'fileName' | 'createdAt'
>

export async function saveLibraryDocument(input: {
  caseId: string
  caseTitle: string
  stepId: string
  stepText: string
  title: string
  previewText: string
  fileName: string
  mimeType: string
  blob: Blob
}): Promise<LibraryDocument> {
  const record: LibraryDocument = {
    id: createId(),
    caseId: input.caseId,
    caseTitle: input.caseTitle,
    stepId: input.stepId,
    stepText: input.stepText,
    title: input.title,
    previewText: input.previewText,
    fileName: input.fileName,
    mimeType: input.mimeType,
    blob: input.blob,
    createdAt: Date.now(),
  }

  await runLocalTransaction(LOCAL_STORES.library, 'readwrite', (store) => store.add(record))
  return record
}

export async function listLibraryDocuments(): Promise<LibraryDocumentSummary[]> {
  const records = await runLocalTransaction<LibraryDocument[]>(LOCAL_STORES.library, 'readonly', (store) =>
    store.getAll(),
  )

  return records
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(({ id, caseId, caseTitle, title, stepText, previewText, fileName, createdAt }) => ({
      id,
      caseId,
      caseTitle,
      title,
      stepText,
      previewText,
      fileName,
      createdAt,
    }))
}

export async function getLibraryDocument(id: string): Promise<LibraryDocument | null> {
  const record = await runLocalTransaction<LibraryDocument | undefined>(LOCAL_STORES.library, 'readonly', (store) =>
    store.get(id),
  )
  return record ?? null
}

export async function deleteLibraryDocument(id: string): Promise<void> {
  await runLocalTransaction(LOCAL_STORES.library, 'readwrite', (store) => store.delete(id))
}

export async function deleteLibraryDocumentsForCase(caseId: string): Promise<void> {
  const records = await runLocalTransaction<LibraryDocument[]>(LOCAL_STORES.library, 'readonly', (store) =>
    store.getAll(),
  )

  const matching = records.filter((record) => record.caseId === caseId)
  await Promise.all(
    matching.map((record) =>
      runLocalTransaction(LOCAL_STORES.library, 'readwrite', (store) => store.delete(record.id)),
    ),
  )
}

export function formatLibraryDate(timestamp: number): string {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}
