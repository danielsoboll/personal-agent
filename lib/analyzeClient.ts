import type {
  AnalyzeRequestBody,
  AnalyzeResponseBody,
  AssessRequestBody,
  AssessResponseBody,
  AnalyzeIntent,
  PrepareStepRequestBody,
  PrepareStepResponseBody,
  StructuredStep,
} from '@/lib/analyzeTypes'
import { blobToDataUrl, compressImageForAnalysis } from '@/lib/compressImage'
import { enrichCaseFileForAssessment, hasHistorieRecords } from '@/lib/caseFileJsonl'
import { getActiveCase, getCaseFileContent } from '@/lib/localCases'
import { listDocumentPhotos } from '@/lib/localDocuments'
import { awaitCaseFileReorganizeForAssessment } from '@/lib/caseFileReorganizeClient'

export async function analyzeCurrentPhotos(options: {
  intent: AnalyzeIntent
}): Promise<AnalyzeResponseBody['result']> {
  const activeCase = await getActiveCase()
  if (!activeCase) {
    throw new Error('Kein aktiver Fall ausgewählt.')
  }

  const photos = await listDocumentPhotos(activeCase.id)
  if (photos.length === 0) {
    throw new Error('Keine Fotos zum Prüfen vorhanden.')
  }

  const existingCaseFile = await getCaseFileContent(activeCase.id)
  const isFollowUp = options.intent !== 'initial'
  const isNewLetterOnSameCase = options.intent === 'initial' && Boolean(activeCase.latestReview)

  if (isFollowUp && !existingCaseFile) {
    throw new Error('Es gibt noch keinen gespeicherten Hintergrund für die Ergänzung.')
  }

  const images: string[] = []
  for (const photo of photos) {
    const compressed = await compressImageForAnalysis(photo.blob)
    images.push(await blobToDataUrl(compressed))
  }

  const body: AnalyzeRequestBody = {
    userName: activeCase.userName,
    caseTitle: activeCase.title,
    caseNumber: activeCase.caseNumber,
    images,
    intent: options.intent,
    existingCaseFile:
      isFollowUp || isNewLetterOnSameCase ? (existingCaseFile ?? undefined) : undefined,
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = (await response.json()) as AnalyzeResponseBody | { error?: string }

  if (!response.ok) {
    throw new Error('error' in payload && payload.error ? payload.error : 'Analyse fehlgeschlagen.')
  }

  if (!('result' in payload)) {
    throw new Error('Ungültige Antwort vom Analyse-Server.')
  }

  return payload.result
}

export async function requestFinalAssessment(): Promise<AssessResponseBody['result']> {
  const activeCase = await getActiveCase()
  if (!activeCase) {
    throw new Error('Kein aktiver Fall ausgewählt.')
  }

  let rawCaseFile = await getCaseFileContent(activeCase.id)
  if (!rawCaseFile) {
    throw new Error('Es gibt noch keine Fallakte für die Bewertung.')
  }

  if (hasHistorieRecords(rawCaseFile)) {
    const consolidated = await awaitCaseFileReorganizeForAssessment(activeCase.id)
    if (consolidated) {
      rawCaseFile = consolidated
    }
  }

  const caseFileContent = enrichCaseFileForAssessment(rawCaseFile, {
    summary: activeCase.latestReview?.summary,
    assessment: activeCase.latestReview?.assessment,
    nextSteps: activeCase.latestReview?.nextSteps,
  })

  const body: AssessRequestBody = {
    userName: activeCase.userName,
    caseTitle: activeCase.title,
    caseNumber: activeCase.caseNumber,
    caseFileContent,
  }

  const response = await fetch('/api/assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = (await response.json()) as AssessResponseBody | { error?: string }

  if (!response.ok) {
    throw new Error('error' in payload && payload.error ? payload.error : 'Bewertung fehlgeschlagen.')
  }

  if (!('result' in payload)) {
    throw new Error('Ungültige Antwort vom Bewertungs-Server.')
  }

  return payload.result
}

export async function prepareStepDocument(step: StructuredStep): Promise<PrepareStepResponseBody> {
  const activeCase = await getActiveCase()
  if (!activeCase) {
    throw new Error('Kein aktiver Fall ausgewählt.')
  }

  const rawCaseFile = await getCaseFileContent(activeCase.id)
  if (!rawCaseFile) {
    throw new Error('Es gibt noch keine Fallakte.')
  }

  const caseFileContent = enrichCaseFileForAssessment(rawCaseFile, {
    summary: activeCase.latestReview?.summary,
    assessment: activeCase.latestReview?.assessment,
    nextSteps: activeCase.latestReview?.nextSteps,
  })

  const body: PrepareStepRequestBody = {
    userName: activeCase.userName,
    caseTitle: activeCase.title,
    caseNumber: activeCase.caseNumber,
    caseFileContent,
    step,
  }

  const response = await fetch('/api/prepare-step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = (await response.json()) as PrepareStepResponseBody | { error?: string }

  if (!response.ok) {
    throw new Error('error' in payload && payload.error ? payload.error : 'Schritt konnte nicht vorbereitet werden.')
  }

  if (!('contentBase64' in payload)) {
    throw new Error('Ungültige Antwort vom Dokument-Server.')
  }

  return payload
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}
