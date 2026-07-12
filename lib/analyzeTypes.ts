export type AnalyzeIntent = 'initial' | 'current_more' | 'historical' | 'final'

/** @deprecated Use AnalyzeIntent */
export type AnalyzeRound = 'initial' | 'followup'

export type StructuredStep = {
  id: string
  text: string
  deadline?: string
  priority?: 'hoch' | 'mittel' | 'niedrig'
}

export type DocumentsStatus = 'not_needed' | 'recommended' | 'required'

export type ReviewPhase = 'interim' | 'final'

export type AnalyzeResult = {
  /** Interne JSONL-Fallakte — nie dem Nutzer anzeigen. */
  caseFileContent: string
  /** Kurze Zusammenfassung für die Übersicht. */
  summary: string
  assessment: string
  nextSteps: string
  structuredSteps: StructuredStep[]
  /** @deprecated Ableitung aus documentsStatus — required = true */
  needsMoreDocuments: boolean
  /** Konkrete Vorschläge, wenn recommended oder required */
  requestedDocuments: string
  /** Bewertung ob weitere Unterlagen nötig/sinnvoll sind */
  documentsStatus: DocumentsStatus
  /** Kurzer Kommentar der KI zur Unterlagen-Einschätzung */
  documentsComment: string
  isComplete: boolean
  /** Nach erstem Scan: Nutzer soll Dokument-Strategie wählen. */
  documentChoiceRequired: boolean
  /** Alle Unterlagen erfasst — Bewertung einholen möglich. */
  readyForFinalAssessment: boolean
  phase: ReviewPhase
  analyzedAt: number
  intent: AnalyzeIntent
  photoCount: number
}

export type AnalyzeRequestBody = {
  userName: string
  caseTitle: string
  images: string[]
  existingCaseFile?: string
  intent: AnalyzeIntent
}

export type AnalyzeResponseBody = {
  result: Omit<AnalyzeResult, 'analyzedAt' | 'intent' | 'photoCount'>
}

export type AssessRequestBody = {
  userName: string
  caseTitle: string
  caseFileContent: string
}

export type AssessResponseBody = {
  result: Omit<AnalyzeResult, 'analyzedAt' | 'intent' | 'photoCount' | 'documentChoiceRequired' | 'readyForFinalAssessment'>
}

export type PrepareStepRequestBody = {
  userName: string
  caseTitle: string
  caseFileContent: string
  step: StructuredStep
}

export type PrepareStepResponseBody = {
  fileName: string
  mimeType: string
  /** Base64-encoded .docx */
  contentBase64: string
  title: string
  previewText: string
}
