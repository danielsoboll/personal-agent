export const DRAFT_CASE_TITLE_KEY = 'behoerdenpost.draftCaseTitle'

export function getDraftCaseTitle(): string {
  if (typeof window === 'undefined') return ''
  return window.sessionStorage.getItem(DRAFT_CASE_TITLE_KEY)?.trim() ?? ''
}

export function setDraftCaseTitle(title: string): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(DRAFT_CASE_TITLE_KEY, title.trim())
}

export function clearDraftCaseTitle(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(DRAFT_CASE_TITLE_KEY)
}
