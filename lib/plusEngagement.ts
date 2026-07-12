const STORAGE_KEY = 'behoerdenpost.plusEngagement.v1'

export const PLUS_DISCOVER_UNLOCK_CHANGED_EVENT = 'behoerdenpost-plus-discover-unlock-changed'

const FINAL_ASSESSMENT_UNLOCK_THRESHOLD = 3

export type PlusEngagement = {
  finalAssessmentCount: number
  wordDocumentsCreated: number
  discoverUnlocked: boolean
}

function readEngagement(): PlusEngagement {
  if (typeof window === 'undefined') {
    return { finalAssessmentCount: 0, wordDocumentsCreated: 0, discoverUnlocked: false }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { finalAssessmentCount: 0, wordDocumentsCreated: 0, discoverUnlocked: false }
    }

    const parsed = JSON.parse(raw) as Partial<PlusEngagement>
    return {
      finalAssessmentCount: typeof parsed.finalAssessmentCount === 'number' ? parsed.finalAssessmentCount : 0,
      wordDocumentsCreated: typeof parsed.wordDocumentsCreated === 'number' ? parsed.wordDocumentsCreated : 0,
      discoverUnlocked: parsed.discoverUnlocked === true,
    }
  } catch {
    return { finalAssessmentCount: 0, wordDocumentsCreated: 0, discoverUnlocked: false }
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
    state.wordDocumentsCreated >= 1 || state.finalAssessmentCount >= FINAL_ASSESSMENT_UNLOCK_THRESHOLD

  if (!shouldUnlock) return state
  return { ...state, discoverUnlocked: true }
}

export function getPlusEngagement(): PlusEngagement {
  return readEngagement()
}

export function isPlusDiscoverUnlocked(): boolean {
  return readEngagement().discoverUnlocked
}

/** Nach erstem Word-Dokument oder 3× „Bewertung einholen“. */
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
