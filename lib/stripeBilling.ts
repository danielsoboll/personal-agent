import { prepareBillingExternalRedirect } from '@/lib/billingReturn'
import { getOrCreateBillingDeviceId } from '@/lib/billingDevice'
import { logUserActivity } from '@/lib/activityLog'
import type { BillingSyncResponse } from '@/lib/billingTypes'
import { applyServerBillingState, readPlusBillingState } from '@/lib/plusBillingStorage'
import { isSupabaseEnvConfigured } from '@/lib/supabaseEnv'

export function isStripeBillingConfigured(): boolean {
  if (process.env.NEXT_PUBLIC_STRIPE_BILLING_ENABLED !== 'true') return false
  if (!isSupabaseEnvConfigured()) return false
  return Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID?.trim() || process.env.STRIPE_PRICE_ID?.trim(),
  )
}

type BillingApiResponse = { url?: string; error?: string }

function resolveSiteUrl(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin.replace(/\/$/, '')
}

async function postBillingApi(path: string, body: Record<string, unknown>): Promise<BillingApiResponse> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = (await response.json()) as BillingApiResponse

  if (!response.ok) {
    throw new Error(payload.error ?? 'Stripe-Anfrage fehlgeschlagen.')
  }

  if (payload.error) {
    throw new Error(payload.error)
  }

  return payload
}

export async function createPlusCheckoutSession(): Promise<{ url: string }> {
  prepareBillingExternalRedirect('/')
  logUserActivity('plus_checkout_started')

  const payload = await postBillingApi('/api/billing/checkout', {
    billing_device_id: getOrCreateBillingDeviceId(),
    site_url: resolveSiteUrl(),
  })

  if (!payload.url) {
    throw new Error('Checkout-URL fehlt.')
  }

  return { url: payload.url }
}

export async function createPlusPortalSession(): Promise<{ url: string }> {
  prepareBillingExternalRedirect('/')

  const billing = readPlusBillingState()
  if (!billing.customerId) {
    throw new Error('Noch kein Stripe-Kunde — zuerst PLUS aktivieren.')
  }

  const payload = await postBillingApi('/api/billing/portal', {
    customer_id: billing.customerId,
    site_url: resolveSiteUrl(),
  })

  if (!payload.url) {
    throw new Error('Portal-URL fehlt.')
  }

  return { url: payload.url }
}

export type VerifiedPlusCheckout = {
  ok: boolean
  isComplete: boolean
  paymentStatus: string | null
  sessionStatus: string | null
  customerId: string | null
  subscriptionId: string | null
  plusActive: boolean
  plusSynced: boolean
}

export async function verifyPlusCheckoutSession(sessionId: string): Promise<VerifiedPlusCheckout> {
  const response = await fetch('/api/billing/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  })

  const payload = (await response.json()) as VerifiedPlusCheckout & { error?: string }

  if (!response.ok) {
    throw new Error(payload.error ?? 'Checkout konnte nicht geprüft werden.')
  }

  return payload
}

export type PlusBillingSyncResult = {
  synced: boolean
  plusActive: boolean
  plan: 'free' | 'plus'
  customerId: string | null
  subscriptionId: string | null
}

export async function syncPlusBillingFromStripe(): Promise<PlusBillingSyncResult> {
  const response = await fetch('/api/billing/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ billing_device_id: getOrCreateBillingDeviceId() }),
  })

  const payload = (await response.json()) as BillingSyncResponse & { error?: string }

  if (!response.ok) {
    throw new Error(payload.error ?? 'Synchronisation fehlgeschlagen.')
  }

  const plusActive = payload.plusActive === true
  applyServerBillingState({
    plusActive,
    customerId: payload.customerId ?? null,
    subscriptionId: payload.subscriptionId ?? null,
    subscriptionStatus: payload.subscriptionStatus ?? null,
  })

  return {
    synced: payload.synced === true,
    plusActive,
    plan: payload.plan === 'plus' ? 'plus' : 'free',
    customerId: payload.customerId ?? null,
    subscriptionId: payload.subscriptionId ?? null,
  }
}
