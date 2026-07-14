const PLUS_WELCOME_PENDING_KEY = 'behoerdenpost.plusWelcomePending'

/** Nach Stripe-Checkout: einmalig Willkommens-Sheet auf der Startseite. */
export function markPlusWelcomePending(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(PLUS_WELCOME_PENDING_KEY, '1')
}

export function consumePlusWelcomePending(): boolean {
  if (typeof window === 'undefined') return false
  if (window.sessionStorage.getItem(PLUS_WELCOME_PENDING_KEY) !== '1') return false
  window.sessionStorage.removeItem(PLUS_WELCOME_PENDING_KEY)
  return true
}
