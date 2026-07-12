import type { AnalyzeResult } from '@/lib/analyzeTypes'
import type { CaseUserStatus } from '@/lib/localCases'

export type ResolvedCaseStatus = 'aktiv' | 'laufend' | 'vorerst_erledigt'

export type CaseStatusDisplay = {
  status: ResolvedCaseStatus
  label: string
  /** Sortierung: niedriger = weiter oben */
  sortTier: number
  tone: 'urgent' | 'progress' | 'done' | 'neutral'
}

export function caseNeedsAttention(review: AnalyzeResult | null): boolean {
  if (!review) return true
  if (review.documentChoiceRequired) return true
  if (review.readyForFinalAssessment) return true
  if (review.documentsStatus === 'required') return true
  if (review.documentsStatus === 'recommended' && review.phase !== 'final') return true
  if (review.phase !== 'final' && !review.isComplete) return true
  return false
}

export function resolveCaseStatus(options: {
  userStatus: CaseUserStatus | null
  hasWordDocs: boolean
  latestReview: AnalyzeResult | null
}): CaseStatusDisplay {
  if (options.userStatus === 'vorerst_erledigt') {
    return { status: 'vorerst_erledigt', label: 'Vorerst erledigt', sortTier: 30, tone: 'done' }
  }

  if (options.userStatus === 'laufend') {
    return { status: 'laufend', label: 'Laufend', sortTier: 20, tone: 'progress' }
  }

  if (options.userStatus === 'aktiv') {
    const urgent = caseNeedsAttention(options.latestReview)
    return {
      status: 'aktiv',
      label: 'Aktiv',
      sortTier: 10,
      tone: urgent ? 'urgent' : 'neutral',
    }
  }

  if (options.hasWordDocs) {
    return { status: 'laufend', label: 'Laufend', sortTier: 20, tone: 'progress' }
  }

  const urgent = caseNeedsAttention(options.latestReview)
  return {
    status: 'aktiv',
    label: 'Aktiv',
    sortTier: 10,
    tone: urgent ? 'urgent' : 'neutral',
  }
}

export function statusBadgeClassName(tone: CaseStatusDisplay['tone']): string {
  switch (tone) {
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200'
    case 'progress':
      return 'bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200'
    case 'done':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
    default:
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
  }
}

export function compareCasesForHome(
  a: { caseNumber: number; display: CaseStatusDisplay; updatedAt: number },
  b: { caseNumber: number; display: CaseStatusDisplay; updatedAt: number },
): number {
  const tierDiff = a.display.sortTier - b.display.sortTier
  if (tierDiff !== 0) return tierDiff
  const numberDiff = a.caseNumber - b.caseNumber
  if (numberDiff !== 0) return numberDiff
  return b.updatedAt - a.updatedAt
}
