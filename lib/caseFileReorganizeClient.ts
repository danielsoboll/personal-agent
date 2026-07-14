import type { AnalyzeIntent } from '@/lib/analyzeTypes'
import type { CaseFileReorganizeOperation } from '@/lib/caseFileReorganizeOps'
import { pickReorganizeAfterAnalyze } from '@/lib/caseFileReorganizeOps'
import { getCase, saveCaseFileContent, saveLatestReview } from '@/lib/localCases'

/** Hintergrund-Neustrukturierung — blockiert die UI nicht. */
export function scheduleCaseFileReorganize(
  caseId: string,
  operation: CaseFileReorganizeOperation | null,
): void {
  if (!operation) return
  void reorganizeCaseFileInBackground(caseId, operation).catch(() => {
    /* optional — Nutzer merkt nichts */
  })
}

/** Vor finaler Bewertung: Historie zusammenfassen, damit der Prompt Kontext nutzt. */
export async function awaitCaseFileReorganizeForAssessment(
  caseId: string,
): Promise<string | null> {
  return reorganizeCaseFileInBackground(caseId, 'consolidate_historie')
}

export function scheduleCaseFileReorganizeAfterAnalyze(caseId: string, intent: AnalyzeIntent): void {
  scheduleCaseFileReorganize(caseId, pickReorganizeAfterAnalyze(intent))
}

async function reorganizeCaseFileInBackground(
  caseId: string,
  operation: CaseFileReorganizeOperation,
): Promise<string | null> {
  const caseRecord = await getCase(caseId)
  if (!caseRecord?.caseFileContent?.trim()) return null

  const response = await fetch('/api/case-file/reorganize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operation,
      userName: caseRecord.userName,
      caseTitle: caseRecord.title,
      caseFileContent: caseRecord.caseFileContent,
      review: caseRecord.latestReview
        ? {
            summary: caseRecord.latestReview.summary,
            assessment: caseRecord.latestReview.assessment,
            nextSteps: caseRecord.latestReview.nextSteps,
            phase: caseRecord.latestReview.phase,
          }
        : null,
    }),
    keepalive: operation !== 'consolidate_historie',
  })

  if (!response.ok) return null

  const payload = (await response.json()) as { caseFileContent?: string }
  if (!payload.caseFileContent?.trim()) return null

  await saveCaseFileContent(caseId, payload.caseFileContent)

  if (caseRecord.latestReview) {
    await saveLatestReview(caseId, {
      ...caseRecord.latestReview,
      caseFileContent: payload.caseFileContent,
    })
  }

  return payload.caseFileContent
}
