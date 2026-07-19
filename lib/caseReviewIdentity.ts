import { createId } from '@/lib/createId'
import type { AnalyzeResult } from '@/lib/analyzeTypes'
import type { CaseDocument } from '@/lib/caseDocumentTypes'
import { formatDeadlineDate } from '@/lib/deadlineDisplay'
import type { FallakteEvent } from '@/lib/fallakteTypes'
import { FALLAKTE_EVENT_TYPE_LABELS } from '@/lib/fallakteTypes'

export function createReviewId(): string {
  return `rev_${createId()}`
}

export function ensureReviewIdentity(
  review: AnalyzeResult,
  options?: {
    documentId?: string | null
    supersedesReviewId?: string | null
  },
): AnalyzeResult {
  const now = Date.now()
  return {
    ...review,
    reviewId: review.reviewId || createReviewId(),
    documentId: options?.documentId ?? review.documentId,
    supersedesReviewId: options?.supersedesReviewId ?? review.supersedesReviewId,
    updatedAt: now,
  }
}

/** Label für Bewertung / Neu-Bewertung des aktuellen Schreibens. */
export function assessmentSubjectLabel(options: {
  currentDocument?: CaseDocument | null
  latestReview?: AnalyzeResult | null
}): string {
  const fromDoc = options.currentDocument?.createdAt
  const fromReview = options.latestReview?.analyzedAt
  const ts = fromDoc || fromReview
  if (!ts) {
    return 'Aktuelles Schreiben erneut im gesamten Fallkontext bewerten'
  }
  const iso = new Date(ts).toISOString().slice(0, 10)
  const readable = formatDeadlineDate(iso) || iso
  return `Aktuelles Schreiben vom ${readable} erneut im gesamten Fallkontext bewerten`
}

export function buildFallakteContextForAssess(events: FallakteEvent[]): string {
  const usable = events.filter(
    (event) =>
      event.confirmationStatus === 'confirmed' || event.confirmationStatus === 'corrected',
  )
  if (usable.length === 0) return ''

  const lines = usable.map((event) => {
    const typeLabel = FALLAKTE_EVENT_TYPE_LABELS[event.eventType] || event.eventType
    const date = event.eventDate || event.eventDateLabel || 'ohne Datum'
    const title = event.title?.trim() || typeLabel
    const desc = event.description?.trim()
    return `- ${date}: ${title} (${typeLabel})${desc ? ` — ${desc.slice(0, 180)}` : ''}`
  })

  return [
    'Bestätigte Fallakte (nur Kontext, nicht Bewertungsgegenstand):',
    ...lines,
  ].join('\n')
}
