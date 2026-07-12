import { isPlusDiscoverUnlocked } from '@/lib/plusEngagement'

const PLUS_ACTIVE_KEY = 'behoerdenpost.plus.active.v1'

/** Lokaler PLUS-Status — später durch Supabase/Stripe ersetzt. */
export function isPlusActive(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(PLUS_ACTIVE_KEY) === '1'
}

export function shouldShowPlusDiscoverHeader(): boolean {
  if (typeof window === 'undefined') return false
  if (isPlusActive()) return true
  return isPlusDiscoverUnlocked()
}
