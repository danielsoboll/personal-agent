const BILLING_DEVICE_ID_KEY = 'behoerdenpost.billingDeviceId.v1'

function createBillingDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Stabile Geräte-ID für Stripe client_reference_id / Metadata (local-first, ohne Login). */
export function getOrCreateBillingDeviceId(): string {
  if (typeof window === 'undefined') return ''

  const existing = window.localStorage.getItem(BILLING_DEVICE_ID_KEY)?.trim()
  if (existing) return existing

  const created = createBillingDeviceId()
  window.localStorage.setItem(BILLING_DEVICE_ID_KEY, created)
  return created
}
