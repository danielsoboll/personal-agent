import { isPlusDiscoverUnlocked } from '@/lib/plusEngagement'
import { readPlusBillingState } from '@/lib/plusBillingStorage'

/** PLUS-Status aus lokalem Billing-Snapshot (Stripe-Verify / später Supabase-Sync). */
export function isPlusActive(): boolean {
  if (typeof window === 'undefined') return false
  return readPlusBillingState().active
}

export function shouldShowPlusDiscoverHeader(): boolean {
  if (typeof window === 'undefined') return false
  if (isPlusActive()) return true
  return isPlusDiscoverUnlocked()
}
