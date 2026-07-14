const STORAGE_KEY = 'behoerdenpost.plusEngagement.v1'

export const PLUS_DISCOVER_UNLOCK_CHANGED_EVENT = 'behoerdenpost-plus-discover-unlock-changed'

const CASE_CREATED_UNLOCK_THRESHOLD = 1
const FINAL_ASSESSMENT_UNLOCK_THRESHOLD = 3

export type PlusEngagement = {
  casesCreated: number
  finalAssessmentCount: number
  wordDocumentsCreated: number
  discoverUnlocked: boolean
}

function emptyEngagement(): PlusEngagement {
  return { casesCreated: 0, finalAssessmentCount: 0, wordDocumentsCreated: 0, discoverUnlocked: false }
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
    state.casesCreated >= CASE_CREATED_UNLOCK_THRESHOLD ||
    state.wordDocumentsCreated >= 1 ||
    state.finalAssessmentCount >= FINAL_ASSESSMENT_UNLOCK_THRESHOLD

  if (!shouldUnlock) return state
  return { ...state, discoverUnlocked: true }
}

export function getPlusEngagement(): PlusEngagement {
  return readEngagement()
}

export function isPlusDiscoverUnlocked(): boolean {
  return readEngagement().discoverUnlocked
}

/** Nach erstem Fall, erstem Word-Dokument oder 3× „Bewertung einholen“. */
export function recordCaseCreated(): void {
  const current = readEngagement()
  const next = unlockIfEligible({
    ...current,
    casesCreated: current.casesCreated + 1,
  })
  writeEngagement(next)
  notifyUnlockChanged()
}

/** Bestehende Nutzer: PLUS-Button ab erstem Fall (z. B. nach Deploy). */
export function ensurePlusDiscoverFromCaseCount(caseCount: number): void {
  if (caseCount < CASE_CREATED_UNLOCK_THRESHOLD) return

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
    finalAssessmentCount: current.finalAssessmentCount + 1,
  })
  writeEngagement(next)
  notifyUnlockChanged()
}
