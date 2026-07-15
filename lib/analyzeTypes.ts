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

export type FollowUpAttachmentMeta = {
  fileName: string
  kind: 'image' | 'pdf'
}

export type FollowUpWordDocument = {
  title: string
  subject: string
  bodyParagraphs: string[]
  previewText: string
  /** Gesetzt, nachdem das Word in der Bibliothek gespeichert wurde. */
  savedFileName?: string
}

export type FollowUpMessage = {
  role: 'user' | 'assistant'
  /** Nur Nutzertext — leer wenn nur Anhänge. Legacy: content bei alten Einträgen. */
  userText?: string
  content: string
  attachments?: FollowUpAttachmentMeta[]
  /** Kurzfassung des technischen Kontexts (Fallakte, Anhänge). */
  contextSummary?: string
  /** Entwurf für ein formales Schreiben — nur wenn die KI eines vorschlägt. */
  wordDocument?: FollowUpWordDocument
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
  /** Nachfragen zur Auswertung — aktualisieren Bewertung und Schritte. */
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

export type WordDocumentRequestBody = {
  userName: string
  content: {
    title: string
    subject: string
    bodyParagraphs: string[]
    previewText: string
  }
}

export type WordDocumentResponseBody = {
  fileName: string
  mimeType: string
  contentBase64: string
  title: string
  previewText: string
}

export type ClarifyRequestBody = {
  userName: string
  caseTitle: string
  caseNumber?: number
  caseFileContent: string
  /** Leer erlaubt, wenn attachments gesetzt — dann Standardfrage. */
  question: string
  attachments?: AnalyzeAttachment[]
  currentReview: Pick<
    AnalyzeResult,
    'summary' | 'assessment' | 'nextSteps' | 'structuredSteps' | 'phase'
  >
  priorMessages?: FollowUpMessage[]
}

export type ClarifyResponseBody = {
  answer: string
  contextSummary: string
  updatedSummary: string
  updatedAssessment: string
  updatedNextSteps: string
  updatedStructuredSteps: StructuredStep[]
  wordDocument?: FollowUpWordDocument
}
