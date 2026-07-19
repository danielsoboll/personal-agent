import type {
  AnalyzeAttachment,
  AnalyzeRequestBody,
  AnalyzeResponseBody,
  AssessRequestBody,
  AssessResponseBody,
  AnalyzeIntent,
  ClarifyRequestBody,
  ClarifyResponseBody,
  DocumentPeekRequestBody,
  DocumentPeekResponseBody,
  DocumentPeekResult,
  FollowUpMessage,
  FollowUpWordDocument,
  WordDocumentRequestBody,
  WordDocumentResponseBody,
} from '@/lib/analyzeTypes'
import { blobToDataUrl, compressImageForAnalysis } from '@/lib/compressImage'
import { MAX_CHAT_ATTACHMENTS } from '@/lib/chatFollowUp'
import { prepareUploadFiles } from '@/lib/documentUpload'
import { enrichCaseFileForAssessment, hasHistorieRecords } from '@/lib/caseFileJsonl'
import { getActiveCase, getCaseFileContent } from '@/lib/localCases'
import { listDocumentPhotos } from '@/lib/localDocuments'
import { awaitCaseFileReorganizeForAssessment } from '@/lib/caseFileReorganizeClient'

export async function analyzeCurrentPhotos(options: {
  intent: AnalyzeIntent
  peekContext?: DocumentPeekResult
}): Promise<AnalyzeResponseBody['result']> {
  const activeCase = await getActiveCase()
  if (!activeCase) {
    throw new Error('Kein aktiver Fall ausgewählt.')
  }

  const photos = await listDocumentPhotos(activeCase.id)
  if (photos.length === 0) {
    throw new Error('Keine Dokumente zum Prüfen vorhanden.')
  }

  const existingCaseFile = await getCaseFileContent(activeCase.id)
  const isFollowUp = options.intent !== 'initial'
  const isNewLetterOnSameCase = options.intent === 'initial' && Boolean(activeCase.latestReview)

  if (isFollowUp && !existingCaseFile) {
    throw new Error('Es gibt noch keinen gespeicherten Hintergrund für die Ergänzung.')
  }

  const attachments: AnalyzeAttachment[] = []
  for (const photo of photos) {
    if (photo.kind === 'pdf') {
      attachments.push({
        kind: 'pdf',
        dataUrl: await blobToDataUrl(photo.blob),
        fileName: photo.fileName,
      })
      continue
    }

    const compressed = await compressImageForAnalysis(photo.blob)
    attachments.push({
      kind: 'image',
      dataUrl: await blobToDataUrl(compressed),
      fileName: photo.fileName,
    })
  }

  const body: AnalyzeRequestBody = {
    userName: activeCase.userName,
    caseTitle: activeCase.title,
    caseNumber: activeCase.caseNumber,
    attachments,
    intent: options.intent,
    existingCaseFile:
      isFollowUp || isNewLetterOnSameCase ? (existingCaseFile ?? undefined) : undefined,
    peekContext: options.peekContext,
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

export async function requestDocumentPeek(options: {
  intent: AnalyzeIntent
  photo: {
    blob: Blob
    kind: 'image' | 'pdf'
    fileName?: string
  }
}): Promise<DocumentPeekResult> {
  const activeCase = await getActiveCase()
  if (!activeCase) {
    throw new Error('Kein aktiver Fall ausgewählt.')
  }

  let attachment: AnalyzeAttachment
  if (options.photo.kind === 'pdf') {
    attachment = {
      kind: 'pdf',
      dataUrl: await blobToDataUrl(options.photo.blob),
      fileName: options.photo.fileName || 'Dokument.pdf',
    }
  } else {
    const compressed = await compressImageForAnalysis(options.photo.blob)
    attachment = {
      kind: 'image',
      dataUrl: await blobToDataUrl(compressed),
      fileName: options.photo.fileName,
    }
  }

  const body: DocumentPeekRequestBody = {
    userName: activeCase.userName,
    caseTitle: activeCase.title,
    caseNumber: activeCase.caseNumber,
    attachment,
    intent: options.intent,
  }

  const response = await fetch('/api/peek', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = (await response.json()) as DocumentPeekResponseBody | { error?: string }

  if (!response.ok) {
    throw new Error('error' in payload && payload.error ? payload.error : 'Kurzblick fehlgeschlagen.')
  }

  if (!('quickGuess' in payload) || !('suggestedQuestion' in payload)) {
    throw new Error('Ungültige Antwort vom Kurzblick-Server.')
  }

  const result = payload as DocumentPeekResponseBody
  return {
    quickGuess: result.quickGuess ?? '',
    suggestedQuestion: result.suggestedQuestion ?? '',
    focusHints: result.focusHints ?? [],
  }
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

export async function buildWordDocument(content: FollowUpWordDocument): Promise<WordDocumentResponseBody> {
  const activeCase = await getActiveCase()
  if (!activeCase) {
    throw new Error('Kein aktiver Fall ausgewählt.')
  }

  const body: WordDocumentRequestBody = {
    userName: activeCase.userName,
    content: {
      title: content.title,
      subject: content.subject,
      bodyParagraphs: content.bodyParagraphs,
      previewText: content.previewText,
    },
  }

  const response = await fetch('/api/word-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = (await response.json()) as WordDocumentResponseBody | { error?: string }

  if (!response.ok) {
    throw new Error('error' in payload && payload.error ? payload.error : 'Word-Schreiben konnte nicht erstellt werden.')
  }

  if (!('contentBase64' in payload)) {
    throw new Error('Ungültige Antwort vom Dokument-Server.')
  }

  return payload
}

export async function submitChatMessage(options: {
  userText?: string
  files?: File[]
}): Promise<ClarifyResponseBody> {
  const activeCase = await getActiveCase()
  if (!activeCase?.latestReview) {
    throw new Error('Es gibt noch keine Auswertung für eine Nachfrage.')
  }

  const rawCaseFile = await getCaseFileContent(activeCase.id)
  if (!rawCaseFile) {
    throw new Error('Es gibt noch keine Fallakte.')
  }

  const trimmedText = options.userText?.trim() ?? ''
  const files = options.files ?? []

  if (!trimmedText && files.length === 0) {
    throw new Error('Bitte schreib eine Nachfrage oder füge mindestens einen Anhang hinzu.')
  }

  if (files.length > MAX_CHAT_ATTACHMENTS) {
    throw new Error(`Maximal ${MAX_CHAT_ATTACHMENTS} Anhänge pro Nachfrage.`)
  }

  const attachments: AnalyzeAttachment[] = []
  for (const file of files) {
    const preparedList = await prepareUploadFiles(file)
    for (const prepared of preparedList) {
      if (prepared.kind === 'pdf') {
        attachments.push({
          kind: 'pdf',
          dataUrl: await blobToDataUrl(prepared.blob),
          fileName: prepared.fileName,
        })
        continue
      }

      const compressed = await compressImageForAnalysis(prepared.blob)
      attachments.push({
        kind: 'image',
        dataUrl: await blobToDataUrl(compressed),
        fileName: prepared.fileName,
      })
    }
  }

  const review = activeCase.latestReview
  const priorMessages: FollowUpMessage[] = (review.followUpMessages ?? []).slice(-8).map((message) => ({
    role: message.role,
    userText: message.userText,
    content: message.content,
    attachments: message.attachments,
    at: message.at,
  }))

  const body: ClarifyRequestBody = {
    userName: activeCase.userName,
    caseTitle: activeCase.title,
    caseNumber: activeCase.caseNumber,
    caseFileContent: rawCaseFile,
    question: trimmedText,
    attachments,
    currentReview: {
      summary: review.summary,
      assessment: review.assessment,
      nextSteps: review.nextSteps,
      structuredSteps: review.structuredSteps ?? [],
      phase: review.phase,
    },
    priorMessages,
  }

  const response = await fetch('/api/clarify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = (await response.json()) as ClarifyResponseBody | { error?: string }

  if (!response.ok) {
    throw new Error('error' in payload && payload.error ? payload.error : 'Nachfrage fehlgeschlagen.')
  }

  if (!('answer' in payload)) {
    throw new Error('Ungültige Antwort vom Nachfrage-Server.')
  }

  return payload
}

/** @deprecated Use submitChatMessage */
export async function askFollowUpQuestion(question: string): Promise<ClarifyResponseBody> {
  return submitChatMessage({ userText: question })
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
