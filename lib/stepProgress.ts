const STORAGE_PREFIX = 'behoerdenpost.steps-done.'

function storageKey(caseId: string): string {
  return `${STORAGE_PREFIX}${caseId}`
}

export function loadDoneStepIds(caseId: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey(caseId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
  } catch {
    return []
  }
}

export function saveDoneStepIds(caseId: string, stepIds: string[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(caseId), JSON.stringify(stepIds))
}

export function toggleDoneStepId(caseId: string, stepId: string): string[] {
  const current = new Set(loadDoneStepIds(caseId))
  if (current.has(stepId)) current.delete(stepId)
  else current.add(stepId)
  const next = [...current]
  saveDoneStepIds(caseId, next)
  return next
}

export function clearDoneStepIds(caseId: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(storageKey(caseId))
}
