import type { AnalyzeResult, DocumentsStatus } from '@/lib/analyzeTypes'

export type ReviewFooterState = {
  showDeleteCase: boolean
  showDocumentChoice: boolean
  showOptionalDocumentChoice: boolean
  showCurrentMoreButton: boolean
  showHistoricalButton: boolean
  showAllCapturedButton: boolean
  showProceedToAssessment: boolean
  showFinalButton: boolean
}

export function reviewNeedsMoreDocuments(status: DocumentsStatus): boolean {
  return status !== 'not_needed'
}

export function reviewFooterState(review: AnalyzeResult | null): ReviewFooterState {
  if (!review) {
    return {
      showDeleteCase: true,
      showDocumentChoice: false,
      showOptionalDocumentChoice: false,
      showCurrentMoreButton: false,
      showHistoricalButton: false,
      showAllCapturedButton: false,
      showProceedToAssessment: false,
      showFinalButton: false,
    }
  }

  const isInterimPending = review.phase === 'interim' && !review.readyForFinalAssessment
  const needsMoreDocuments = reviewNeedsMoreDocuments(review.documentsStatus)
  const showDocumentChoice = isInterimPending && needsMoreDocuments
  const showOptionalDocumentChoice = isInterimPending && !needsMoreDocuments
  const showCurrentMoreButton = showDocumentChoice || showOptionalDocumentChoice
  const showHistoricalButton = showDocumentChoice || showOptionalDocumentChoice
  const showAllCapturedButton = showDocumentChoice && review.intent !== 'initial'
  const showProceedToAssessment = showOptionalDocumentChoice
  const showFinalButton = review.readyForFinalAssessment && review.phase !== 'final'

  return {
    showDeleteCase: true,
    showDocumentChoice,
    showOptionalDocumentChoice,
    showCurrentMoreButton,
    showHistoricalButton,
    showAllCapturedButton,
    showProceedToAssessment,
    showFinalButton,
  }
}

export function documentChoiceHint(
  review: AnalyzeResult,
  showAllCapturedButton: boolean,
  optional = false,
): string {
  if (optional) {
    return 'Die KI sieht aktuell keine weiteren Pflicht-Unterlagen — du kannst trotzdem optional ergänzen, falls du noch etwas hinzufügen möchtest.'
  }

  if (showAllCapturedButton) {
    return 'Wähle, wie es weitergeht: Ergänzungsfotos zum aktuellen Schreiben, ältere Unterlagen für den Hintergrund — oder signalisiere, dass alle relevanten Dokumente erfasst sind.'
  }

  if (review.intent === 'initial') {
    return 'Du kannst ergänzende Fotos zum aktuellen Schreiben hochladen oder ältere Unterlagen für den Hintergrund erfassen.'
  }

  return 'Du kannst weitere Fotos zum aktuellen Schreiben oder ältere Unterlagen hinzufügen.'
}
