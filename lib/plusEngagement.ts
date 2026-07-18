const STORAGE_KEY = 'behoerdenpost.plusEngagement.v2'

export const PLUS_DISCOVER_UNLOCK_CHANGED_EVENT = 'behoerdenpost-plus-discover-unlock-changed'

/** Kostenlos: ein Fall. Ab dem 2. Fall → PLUS entdecken. */
export const FREE_CASE_LIMIT = 1

export type PlusEngagement = {
  casesCreated: number
  finalAssessmentCount: number
  wordDocumentsCreated: number
  /** Erster Fall ausgewertet oder als erledigt markiert. */
  firstCaseSettled: boolean
  discoverUnlocked: boolean
}

function emptyEngagement(): PlusEngagement {
  return {
    casesCreated: 0,
    finalAssessmentCount: 0,
    wordDocumentsCreated: 0,
    firstCaseSettled: false,
    discoverUnlocked: false,
  }
}

function readEngagement(): PlusEngagement {
  if (typeof window === 'undefined') {
    return emptyEngagement()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return emptyEngagement()
    }

    const parsed = JSON.parse(raw) as Partial<PlusEngagement>
    return {
      casesCreated: typeof parsed.casesCreated === 'number' ? parsed.casesCreated : 0,
      finalAssessmentCount: typeof parsed.finalAssessmentCount === 'number' ? parsed.finalAssessmentCount : 0,
      wordDocumentsCreated: typeof parsed.wordDocumentsCreated === 'number' ? parsed.wordDocumentsCreated : 0,
      firstCaseSettled: parsed.firstCaseSettled === true,
      discoverUnlocked: parsed.discoverUnlocked === true,
    }
  } catch {
    return emptyEngagement()
  }
}

function writeEngagement(next: PlusEngagement): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function notifyUnlockChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(PLUS_DISCOVER_UNLOCK_CHANGED_EVENT))
}

function unlockIfEligible(state: PlusEngagement): PlusEngagement {
  if (state.discoverUnlocked) return state

  const shouldUnlock =
    state.firstCaseSettled ||
    state.casesCreated > FREE_CASE_LIMIT ||
    state.wordDocumentsCreated >= 1 ||
    state.finalAssessmentCount >= 1

  if (!shouldUnlock) return state
  return { ...state, discoverUnlocked: true }
}

export function getPlusEngagement(): PlusEngagement {
  return readEngagement()
}

export function isPlusDiscoverUnlocked(): boolean {
  return readEngagement().discoverUnlocked
}

/** Sofort PLUS-Hinweis freischalten (z. B. an der kostenlosen Fall-Grenze). */
export function unlockPlusDiscoverNow(): void {
  const current = readEngagement()
  if (current.discoverUnlocked) {
    notifyUnlockChanged()
    return
  }
  writeEngagement({ ...current, discoverUnlocked: true })
  notifyUnlockChanged()
}

/** Nur Zähler — PLUS-Hinweis erst nach erstem erledigten Fall / Limit. */
export function recordCaseCreated(): void {
  const current = readEngagement()
  const next = unlockIfEligible({
    ...current,
    casesCreated: current.casesCreated + 1,
  })
  writeEngagement(next)
  if (next.discoverUnlocked !== current.discoverUnlocked) {
    notifyUnlockChanged()
  }
}

type HomeCaseHint = {
  latestReview?: unknown
  userStatus?: string
}

/**
 * Startseite: PLUS-Button/Teaser erst, wenn der erste Fall ausgewertet oder erledigt ist —
 * oder wenn die kostenlose Fall-Grenze überschritten ist.
 */
export function ensurePlusDiscoverFromHomeCases(cases: HomeCaseHint[]): void {
  const current = readEngagement()
  const settled = cases.some(
    (item) => Boolean(item.latestReview) || item.userStatus === 'vorerst_erledigt',
  )
  const next = unlockIfEligible({
    ...current,
    casesCreated: Math.max(current.casesCreated, cases.length),
    firstCaseSettled: current.firstCaseSettled || settled,
  })

  if (
    next.discoverUnlocked === current.discoverUnlocked &&
    next.casesCreated === current.casesCreated &&
    next.firstCaseSettled === current.firstCaseSettled
  ) {
    return
  }

  writeEngagement(next)
  notifyUnlockChanged()
}

/** @deprecated → ensurePlusDiscoverFromHomeCases */
export function ensurePlusDiscoverFromCaseCount(caseCount: number): void {
  if (caseCount <= FREE_CASE_LIMIT) return
  const current = readEngagement()
  const next = unlockIfEligible({
    ...current,
    casesCreated: Math.max(current.casesCreated, caseCount),
  })
  if (next.discoverUnlocked === current.discoverUnlocked && next.casesCreated === current.casesCreated) {
    return
  }
  writeEngagement(next)
  notifyUnlockChanged()
}

export function recordWordDocumentCreated(): void {
  const current = readEngagement()
  const next = unlockIfEligible({
    ...current,
    wordDocumentsCreated: current.wordDocumentsCreated + 1,
  })
  writeEngagement(next)
  notifyUnlockChanged()
}

export function recordFinalAssessmentCompleted(): void {
  const current = readEngagement()
  const next = unlockIfEligible({
    ...current,
    firstCaseSettled: true,
    finalAssessmentCount: current.finalAssessmentCount + 1,
  })
  writeEngagement(next)
  notifyUnlockChanged()
}

/** Nach erfolgreicher Prüfung / Auswertung eines Falls. */
export function recordCaseReviewCompleted(): void {
  const current = readEngagement()
  if (current.firstCaseSettled && current.discoverUnlocked) return

  const next = unlockIfEligible({
    ...current,
    firstCaseSettled: true,
  })
  writeEngagement(next)
  notifyUnlockChanged()
}
