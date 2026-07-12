import type { AnalyzeRequestBody, AnalyzeResponseBody, AnalyzeRound } from '@/lib/analyzeTypes'
import { blobToDataUrl, compressImageForAnalysis } from '@/lib/compressImage'
import { getActiveCase, getCaseFileContent } from '@/lib/localCases'
import { listDocumentPhotos } from '@/lib/localDocuments'

export async function analyzeCurrentPhotos(options: {
  round: AnalyzeRound
}): Promise<AnalyzeResponseBody['result']> {
  const activeCase = await getActiveCase()
  if (!activeCase) {
    throw new Error('Kein aktiver Fall ausgewählt.')
  }

  const photos = await listDocumentPhotos(activeCase.id)
  if (photos.length === 0) {
    throw new Error('Keine Fotos zum Prüfen vorhanden.')
  }

  const existingCaseFile =
    options.round === 'followup' ? await getCaseFileContent(activeCase.id) : null
  if (options.round === 'followup' && !existingCaseFile) {
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
    images,
    round: options.round,
    existingCaseFile: existingCaseFile ?? undefined,
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
