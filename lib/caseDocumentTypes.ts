/** Dauerhafte Dokument-Identität pro Fall (IndexedDB). */

export const CASE_DOCUMENT_ROLES = ['current', 'historical', 'supporting', 'response'] as const

export type CaseDocumentRole = (typeof CASE_DOCUMENT_ROLES)[number]

export type CaseDocument = {
  id: string
  caseId: string
  role: CaseDocumentRole
  fileName: string
  kind: 'image' | 'pdf'
  mimeType?: string
  /** Originalbytes — für aktuelles Schreiben möglichst behalten. */
  blob: Blob | null
  createdAt: number
  updatedAt: number
  sourceAnalysisBatchId: string | null
  /** Gesetzt, wenn ein früherer Current durch ein neues Schreiben abgelöst wurde. */
  supersededAt: number | null
}

export function roleFromAnalyzeIntent(
  intent: 'initial' | 'current_more' | 'historical' | 'final',
): CaseDocumentRole {
  if (intent === 'historical') return 'historical'
  if (intent === 'current_more') return 'response'
  return 'current'
}
