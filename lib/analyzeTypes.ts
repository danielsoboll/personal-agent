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

export type FollowUpMessage = {
  role: 'user' | 'assistant'
  content: string
  /** Hinweis der KI, ob die ursprüngliche Auswertung korrigiert werden sollte. */
  correctionNote?: string
  at: number
}

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
  /** Nachfragen zur Auswertung — ändert summary/assessment nicht. */
  followUpMessages?: FollowUpMessage[]
}

export type AnalyzeAttachment = {
  kind: 'image' | 'pdf'
  dataUrl: string
  fileName?: string
}

export type AnalyzeRequestBody = {
  userName: string
  caseTitle: string
  /** Lokale Fallnummer — nur zur Prompt-Zuordnung, kein PII. */
  caseNumber?: number
  attachments: AnalyzeAttachment[]
  existingCaseFile?: string
  intent: AnalyzeIntent
}

export type AnalyzeResponseBody = {
  result: Omit<AnalyzeResult, 'analyzedAt' | 'intent' | 'photoCount'>
}

export type AssessRequestBody = {
  userName: string
  caseTitle: string
  caseNumber?: number
  caseFileContent: string
}

export type AssessResponseBody = {
  result: Omit<AnalyzeResult, 'analyzedAt' | 'intent' | 'photoCount' | 'documentChoiceRequired' | 'readyForFinalAssessment'>
}

export type PrepareStepRequestBody = {
  userName: string
  caseTitle: string
  caseNumber?: number
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

export type ClarifyRequestBody = {
  userName: string
  caseTitle: string
  caseNumber?: number
  caseFileContent: string
  question: string
  currentReview: Pick<
    AnalyzeResult,
    'summary' | 'assessment' | 'nextSteps' | 'structuredSteps' | 'phase'
  >
  priorMessages?: FollowUpMessage[]
}

export type ClarifyResponseBody = {
  answer: string
  correctionNote: string
}
