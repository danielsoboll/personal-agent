export const BILLING_SUCCESS_PATH = '/plus/success'
export const BILLING_CANCEL_PATH = '/plus/cancel'
export const BILLING_RETURN_TARGET_PATH = '/'

const BILLING_SNAPSHOT_KEY = 'behoerdenpost.billingReturnSnapshot.v1'

export type BillingReturnSnapshot = {
  savedAt: number
  returnPath: string
}

export function prepareBillingExternalRedirect(returnPath = BILLING_RETURN_TARGET_PATH): void {
  if (typeof window === 'undefined') return

  const snapshot: BillingReturnSnapshot = {
    savedAt: Date.now(),
    returnPath,
  }

  try {
    window.sessionStorage.setItem(BILLING_SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch {
    /* ignore */
  }
}

export function readBillingReturnSnapshot(): BillingReturnSnapshot | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(BILLING_SNAPSHOT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as BillingReturnSnapshot
  } catch {
    return null
  }
}

export function clearBillingReturnSnapshot(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(BILLING_SNAPSHOT_KEY)
  } catch {
    /* ignore */
  }
}
