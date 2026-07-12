import { prepareBillingExternalRedirect } from '@/lib/billingReturn'

export function isStripeBillingConfigured(): boolean {
  return process.env.NEXT_PUBLIC_STRIPE_BILLING_ENABLED === 'true'
}

type CheckoutResponse = { url?: string; error?: string }

export async function createPlusCheckoutSession(): Promise<{ url: string }> {
  prepareBillingExternalRedirect('/')

  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  const payload = (await response.json()) as CheckoutResponse

  if (!response.ok) {
    throw new Error(payload.error ?? 'Checkout fehlgeschlagen.')
  }

  if (!payload.url) {
    throw new Error('Checkout-URL fehlt.')
  }

  return { url: payload.url }
}

export async function createPlusPortalSession(): Promise<{ url: string }> {
  prepareBillingExternalRedirect('/')

  const response = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  const payload = (await response.json()) as CheckoutResponse

  if (!response.ok) {
    throw new Error(payload.error ?? 'Kundenportal konnte nicht geöffnet werden.')
  }

  if (!payload.url) {
    throw new Error('Portal-URL fehlt.')
  }

  return { url: payload.url }
}
