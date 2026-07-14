import { isPlusDiscoverUnlocked } from '@/lib/plusEngagement'
import { isPlusEntitled } from '@/lib/plusEntitlement'
import { readPlusBillingState } from '@/lib/plusBillingStorage'

/** PLUS-Status — server-synchronisiert (plus_until, Abo-Status) wie LifeXP Family. */
export function isPlusActive(): boolean {
  if (typeof window === 'undefined') return false
  return isPlusEntitled(readPlusBillingState())
}

export function shouldShowPlusDiscoverHeader(): boolean {
  if (typeof window === 'undefined') return false
  if (isPlusActive()) return true
  return isPlusDiscoverUnlocked()
}
