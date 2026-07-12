export type AnalyzeRound = 'initial' | 'followup'

export type AnalyzeResult = {
  /** Interne JSONL-Fallakte — nie dem Nutzer anzeigen. */
  caseFileContent: string
  assessment: string
  nextSteps: string
  needsMoreDocuments: boolean
  requestedDocuments: string
  isComplete: boolean
  analyzedAt: number
  round: AnalyzeRound
  photoCount: number
}

export type AnalyzeRequestBody = {
  userName: string
  caseTitle: string
  images: string[]
  existingCaseFile?: string
  round: AnalyzeRound
}

export type AnalyzeResponseBody = {
  result: Omit<AnalyzeResult, 'analyzedAt' | 'round' | 'photoCount'>
}
