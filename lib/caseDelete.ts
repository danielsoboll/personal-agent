import { clearDraftCaseTitle } from '@/lib/draftCase'
import { LOCAL_STORES, runLocalTransaction } from '@/lib/localDb'
import { listCases, removeCase } from '@/lib/localCases'
import { clearDocumentPhotos } from '@/lib/localDocuments'
import { deleteLibraryDocumentsForCase } from '@/lib/localLibrary'

/** Alte Ein-Fall-Stores (vor v3) — bei kompletter Löschung bereinigen. */
async function clearLegacyCaseStores(): Promise<void> {
  await runLocalTransaction(LOCAL_STORES.caseFile, 'readwrite', (store) => store.delete('main'))
  await runLocalTransaction(LOCAL_STORES.review, 'readwrite', (store) => store.delete('main'))
}

/**
 * Entfernt alle lokalen Daten eines Falls:
 * Scan-Fotos, Word-Dokumente, JSONL-Fallakte, gespeicherte KI-Auswertung.
 */
export async function deleteCaseCompletely(caseId: string): Promise<void> {
  const casesBefore = await listCases()
  const isLastCase = casesBefore.length === 1 && casesBefore[0].id === caseId

  await clearDocumentPhotos(caseId)
  await deleteLibraryDocumentsForCase(caseId)
  await removeCase(caseId)

  if (isLastCase) {
    await clearLegacyCaseStores()
    clearDraftCaseTitle()
  }
}
