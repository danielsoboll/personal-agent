import type { AnalyzeResult, DocumentsStatus } from '@/lib/analyzeTypes'

export type ReviewFooterState = {
  showDeleteCase: boolean
  showDocumentChoice: boolean
  showCurrentMoreButton: boolean
  showHistoricalButton: boolean
  showAllCapturedButton: boolean
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
      showCurrentMoreButton: false,
      showHistoricalButton: false,
      showAllCapturedButton: false,
      showFinalButton: false,
    }
  }

  const needsMoreDocuments = reviewNeedsMoreDocuments(review.documentsStatus)
  const showDocumentChoice =
    review.phase === 'interim' && !review.readyForFinalAssessment && needsMoreDocuments
  const showAllCapturedButton = showDocumentChoice && review.intent !== 'initial'
  const showFinalButton = review.readyForFinalAssessment && review.phase !== 'final'

  return {
    showDeleteCase: true,
    showDocumentChoice,
    showCurrentMoreButton: showDocumentChoice,
    showHistoricalButton: showDocumentChoice,
    showAllCapturedButton,
    showFinalButton,
  }
}

export function documentChoiceHint(review: AnalyzeResult, showAllCapturedButton: boolean): string {
  if (showAllCapturedButton) {
    return 'Wähle, wie es weitergeht: Ergänzungsfotos zum aktuellen Schreiben, ältere Unterlagen für den Hintergrund — oder signalisiere, dass alle relevanten Dokumente erfasst sind.'
  }

  if (review.intent === 'initial') {
    return 'Du kannst ergänzende Fotos zum aktuellen Schreiben hochladen oder ältere Unterlagen für den Hintergrund erfassen.'
  }

  return 'Du kannst weitere Fotos zum aktuellen Schreiben oder ältere Unterlagen hinzufügen.'
}
