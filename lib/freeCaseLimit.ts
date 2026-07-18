import { FREE_CASE_LIMIT } from '@/lib/plusEngagement'
import { isPlusActive } from '@/lib/plusStatus'

/** Ohne PLUS: nur ein Fall gleichzeitig — danach löschen oder PLUS. */
export function isAtFreeCaseLimit(caseCount: number): boolean {
  if (isPlusActive()) return false
  return caseCount >= FREE_CASE_LIMIT
}

export function canCreateAnotherCase(caseCount: number): boolean {
  return !isAtFreeCaseLimit(caseCount)
}
