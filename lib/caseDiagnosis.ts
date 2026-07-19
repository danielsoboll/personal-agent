import { parseCaseFileJsonl } from '@/lib/caseFileJsonl'
import { getActiveCase, getCase, type StoredCase } from '@/lib/localCases'
import { listCaseDocuments } from '@/lib/localCaseDocuments'
import { listFallakteEvents } from '@/lib/localFallakte'
import { listFallakteRelations } from '@/lib/localFallakteRelations'
import { listDocumentPhotos } from '@/lib/localDocuments'

export type CaseDiagnosisReport = {
  generatedAt: number
  caseId: string
  title: string
  currentDocumentId: string | null
  photosStagingCount: number
  latestReview: {
    intent?: string
    phase?: string
    analyzedAt?: number
    reviewId?: string
    documentId?: string
    summary?: string
    assessmentPreview?: string
  } | null
  previousLatestReview: {
    intent?: string
    analyzedAt?: number
    reviewId?: string
    summary?: string
  } | null
  jsonl: {
    lineCount: number
    anfrageTexts: string[]
    resultatSummaries: string[]
    dokumentTitles: { rolle?: string; titel?: string; datum?: string }[]
    blocks: { id?: string; art?: string; status?: string }[]
  }
  fallakte: {
    total: number
    byStatus: Record<string, number>
    earliestBatchId: string | null
    earliestDocumentRef: unknown
  }
  documents: {
    id: string
    role: string
    fileName: string
    hasBlob: boolean
    createdAt: number
    sourceAnalysisBatchId: string | null
  }[]
  relationsCount: number
  recoveryHints: string[]
}

function previewReview(review: StoredCase['latestReview']) {
  if (!review) return null
  return {
    intent: review.intent,
    phase: review.phase,
    analyzedAt: review.analyzedAt,
    reviewId: review.reviewId,
    documentId: review.documentId,
    summary: review.summary?.slice(0, 220),
    assessmentPreview: review.assessment?.slice(0, 280),
  }
}

export async function diagnoseCase(caseId: string): Promise<CaseDiagnosisReport> {
  const caseRecord = await getCase(caseId)
  if (!caseRecord) throw new Error('Fall nicht gefunden.')

  const [events, relations, documents, photos] = await Promise.all([
    listFallakteEvents(caseId),
    listFallakteRelations(caseId),
    listCaseDocuments(caseId),
    listDocumentPhotos(caseId),
  ])

  let records: Record<string, unknown>[] = []
  try {
    if (caseRecord.caseFileContent?.trim()) {
      records = parseCaseFileJsonl(caseRecord.caseFileContent) as Record<string, unknown>[]
    }
  } catch {
    records = []
  }

  const byStatus: Record<string, number> = {}
  for (const event of events) {
    byStatus[event.confirmationStatus] = (byStatus[event.confirmationStatus] || 0) + 1
  }

  const sortedEvents = [...events].sort((a, b) => a.createdAt - b.createdAt)
  const earliest = sortedEvents[0] ?? null

  const recoveryHints: string[] = []
  if (caseRecord.previousLatestReview) {
    recoveryHints.push(
      'previousLatestReview ist vorhanden — restorePreviousLatestReview(caseId) kann die letzte Version zurückholen.',
    )
  } else {
    recoveryHints.push(
      'Kein previousLatestReview — eine ältere Auswertung ist lokal nicht versioniert verfügbar.',
    )
  }

  if (caseRecord.currentDocumentId) {
    recoveryHints.push(`currentDocumentId ist gesetzt: ${caseRecord.currentDocumentId}`)
  } else if (documents.some((doc) => doc.role === 'current')) {
    recoveryHints.push(
      'Es gibt Dokumente mit role=current, aber currentDocumentId fehlt — inferCurrentDocumentIdFromDocuments nutzen.',
    )
  } else {
    recoveryHints.push(
      'Kein current-Dokument gespeichert. Originalfotos nach Scan gelöscht — ggf. aktuelles Schreiben erneut hochladen.',
    )
  }

  if ((byStatus.confirmed || 0) + (byStatus.corrected || 0) > 0) {
    recoveryHints.push(
      'Bestätigte Fallakte ist vorhanden und bleibt bei Review-Reparatur unberührt.',
    )
  }

  return {
    generatedAt: Date.now(),
    caseId: caseRecord.id,
    title: caseRecord.title,
    currentDocumentId: caseRecord.currentDocumentId ?? null,
    photosStagingCount: photos.length,
    latestReview: previewReview(caseRecord.latestReview),
    previousLatestReview: caseRecord.previousLatestReview
      ? {
          intent: caseRecord.previousLatestReview.intent,
          analyzedAt: caseRecord.previousLatestReview.analyzedAt,
          reviewId: caseRecord.previousLatestReview.reviewId,
          summary: caseRecord.previousLatestReview.summary?.slice(0, 220),
        }
      : null,
    jsonl: {
      lineCount: records.length,
      anfrageTexts: records
        .filter((row) => row.typ === 'anfrage')
        .map((row) => String(row.text ?? '').slice(0, 240)),
      resultatSummaries: records
        .filter((row) => row.typ === 'resultat')
        .map((row) => String(row.summary ?? '').slice(0, 240)),
      dokumentTitles: records
        .filter((row) => row.typ === 'dokument')
        .map((row) => ({
          rolle: typeof row.rolle === 'string' ? row.rolle : undefined,
          titel: typeof row.titel === 'string' ? row.titel : undefined,
          datum: typeof row.datum === 'string' ? row.datum : undefined,
        })),
      blocks: records
        .filter((row) => row.typ === 'block')
        .map((row) => ({
          id: typeof row.id === 'string' ? row.id : undefined,
          art: typeof row.art === 'string' ? row.art : undefined,
          status: typeof row.status === 'string' ? row.status : undefined,
        })),
    },
    fallakte: {
      total: events.length,
      byStatus,
      earliestBatchId: earliest?.analysisBatchId ?? null,
      earliestDocumentRef: earliest?.documentRef ?? null,
    },
    documents: documents.map((doc) => ({
      id: doc.id,
      role: doc.role,
      fileName: doc.fileName,
      hasBlob: Boolean(doc.blob),
      createdAt: doc.createdAt,
      sourceAnalysisBatchId: doc.sourceAnalysisBatchId,
    })),
    relationsCount: relations.length,
    recoveryHints,
  }
}

export async function diagnoseActiveCase(): Promise<CaseDiagnosisReport | null> {
  const active = await getActiveCase()
  if (!active) return null
  return diagnoseCase(active.id)
}

/** Setzt currentDocumentId auf das älteste current-Dokument oder das früheste vorhandene. */
export async function inferCurrentDocumentIdFromDocuments(caseId: string): Promise<string | null> {
  const { setCurrentDocumentId } = await import('@/lib/localCases')
  const { listCaseDocuments, setDocumentRole } = await import('@/lib/localCaseDocuments')

  const docs = await listCaseDocuments(caseId)
  if (docs.length === 0) return null

  const current = docs.find((doc) => doc.role === 'current')
  if (current) {
    await setCurrentDocumentId(caseId, current.id)
    return current.id
  }

  // Heuristik: ältestes Dokument ohne historical-only Batch — sonst ältestes insgesamt als current markieren
  const oldest = docs[0]
  await setDocumentRole(oldest.id, 'current')
  await setCurrentDocumentId(caseId, oldest.id)
  return oldest.id
}
