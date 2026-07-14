import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

import { getStripe } from './billingStripe.ts'

export type BillingDeviceRow = {
  device_id: string
  profile_id: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: 'free' | 'plus'
  subscription_status: string | null
  plus_until: string | null
  cancel_at_period_end: boolean
}

export type BillingDeviceStatus = {
  deviceId: string
  plan: 'free' | 'plus'
  plusActive: boolean
  customerId: string | null
  subscriptionId: string | null
  subscriptionStatus: string | null
  plusUntil: string | null
  cancelAtPeriodEnd: boolean
}

const TERMINAL_SUBSCRIPTION_STATUSES = new Set([
  'canceled',
  'unpaid',
  'incomplete_expired',
])

export function planFromSubscriptionStatus(status: string): 'free' | 'plus' {
  return status === 'active' || status === 'trialing' || status === 'past_due' ? 'plus' : 'free'
}

export function stripeUnixToTimestamptz(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  const instant = new Date(value * 1000)
  if (Number.isNaN(instant.getTime())) return null
  return instant.toISOString()
}

function readPositiveUnix(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return value
}

export function subscriptionPeriodEndUnix(subscription: Stripe.Subscription): number | null {
  const topLevel = readPositiveUnix(subscription.current_period_end)
  if (topLevel !== null) return topLevel

  for (const item of subscription.items?.data ?? []) {
    const fromItem = readPositiveUnix(item.current_period_end)
    if (fromItem !== null) return fromItem
  }

  return null
}

export function isPlusEntitledFromSubscription(
  status: string,
  periodEndUnix: number | null,
  nowMs = Date.now(),
): boolean {
  if (periodEndUnix !== null && periodEndUnix * 1000 > nowMs) return true
  return planFromSubscriptionStatus(status) === 'plus'
}

export function readBillingDeviceId(
  metadata: Stripe.Metadata | null | undefined,
  clientReferenceId?: string | null,
): string | null {
  const fromMeta = metadata?.billing_device_id
  if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta.trim()

  if (typeof clientReferenceId === 'string' && clientReferenceId.trim()) {
    return clientReferenceId.trim()
  }

  return null
}

export function buildBillingDevicePatchFromSubscription(
  subscription: Stripe.Subscription,
  customerId: string,
): Record<string, unknown> {
  const status = typeof subscription.status === 'string' ? subscription.status : 'unknown'
  const periodEndUnix = subscriptionPeriodEndUnix(subscription)
  const plusUntil = stripeUnixToTimestamptz(periodEndUnix)
  const plan = isPlusEntitledFromSubscription(status, periodEndUnix) ? 'plus' : 'free'

  const patch: Record<string, unknown> = {
    plan,
    subscription_status: status,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    cancel_at_period_end: subscription.cancel_at_period_end === true,
    updated_at: new Date().toISOString(),
  }

  if (plusUntil !== null) {
    patch.plus_until = plusUntil
  } else if (TERMINAL_SUBSCRIPTION_STATUSES.has(status)) {
    patch.plus_until = null
  }

  return patch
}

export async function ensureFullStripeSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<Stripe.Subscription> {
  if (!subscription.id) return subscription

  const hasStatus = typeof subscription.status === 'string' && subscription.status.length > 0
  const hasPeriodEnd = subscriptionPeriodEndUnix(subscription) !== null
  if (hasStatus && hasPeriodEnd) return subscription

  try {
    return await stripe.subscriptions.retrieve(subscription.id)
  } catch (error) {
    console.warn('ensureFullStripeSubscription retrieve failed', subscription.id, error)
    return subscription
  }
}

export async function upsertBillingDeviceRow(
  admin: SupabaseClient,
  deviceId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { data: existing, error: readError } = await admin
    .from('billing_devices')
    .select('device_id')
    .eq('device_id', deviceId)
    .maybeSingle()

  if (readError) throw new Error(readError.message)

  if (existing?.device_id) {
    const { error } = await admin.from('billing_devices').update(patch).eq('device_id', deviceId)
    if (error) throw new Error(error.message)
    return
  }

  const { error } = await admin.from('billing_devices').insert({
    device_id: deviceId,
    ...patch,
  })
  if (error) throw new Error(error.message)
}

async function syncLinkedProfile(
  admin: SupabaseClient,
  deviceId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { data: device, error } = await admin
    .from('billing_devices')
    .select('profile_id')
    .eq('device_id', deviceId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  const profileId = device?.profile_id
  if (typeof profileId !== 'string' || !profileId) return

  const profilePatch: Record<string, unknown> = {
    plan: patch.plan,
    subscription_status: patch.subscription_status,
    stripe_customer_id: patch.stripe_customer_id,
    stripe_subscription_id: patch.stripe_subscription_id,
    plus_until: patch.plus_until ?? null,
    updated_at: patch.updated_at,
  }

  const { error: profileError } = await admin.from('profiles').update(profilePatch).eq('id', profileId)
  if (profileError) throw new Error(profileError.message)
}

export async function syncBillingDeviceFromSubscription(
  admin: SupabaseClient,
  deviceId: string,
  subscription: Stripe.Subscription,
  customerId: string,
): Promise<BillingDeviceStatus> {
  const patch = buildBillingDevicePatchFromSubscription(subscription, customerId)
  await upsertBillingDeviceRow(admin, deviceId, patch)
  await syncLinkedProfile(admin, deviceId, patch)
  return rowToStatus(deviceId, patch)
}

export async function resolveBillingDeviceIdFromStripe(
  admin: SupabaseClient,
  metadata: Stripe.Metadata | null | undefined,
  subscriptionId?: string | null,
  customerId?: string | null,
  clientReferenceId?: string | null,
): Promise<string | null> {
  const fromMeta = readBillingDeviceId(metadata, clientReferenceId)
  if (fromMeta) return fromMeta

  if (subscriptionId) {
    const { data } = await admin
      .from('billing_devices')
      .select('device_id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle()
    if (data?.device_id) return data.device_id as string
  }

  if (customerId) {
    const { data } = await admin
      .from('billing_devices')
      .select('device_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    if (data?.device_id) return data.device_id as string
  }

  return null
}

export async function syncBillingDeviceFromCheckoutSession(
  admin: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<{ deviceId: string | null; synced: boolean; status: BillingDeviceStatus | null }> {
  if (session.mode !== 'subscription' || session.status !== 'complete') {
    return { deviceId: null, synced: false, status: null }
  }

  const paymentStatus = session.payment_status ?? 'unpaid'
  if (paymentStatus !== 'paid' && paymentStatus !== 'no_payment_required') {
    return { deviceId: null, synced: false, status: null }
  }

  const deviceId = readBillingDeviceId(session.metadata, session.client_reference_id)
  if (!deviceId) return { deviceId: null, synced: false, status: null }

  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id
  if (!subscriptionId || !customerId) return { deviceId, synced: false, status: null }

  const stripe = getStripe()
  let subscription = await stripe.subscriptions.retrieve(subscriptionId)
  subscription = await ensureFullStripeSubscription(stripe, subscription)
  const status = await syncBillingDeviceFromSubscription(admin, deviceId, subscription, customerId)
  return { deviceId, synced: true, status }
}

export async function syncBillingDeviceFromStripeByDeviceId(
  admin: SupabaseClient,
  deviceId: string,
): Promise<{ synced: boolean; status: BillingDeviceStatus | null }> {
  const { data: device, error } = await admin
    .from('billing_devices')
    .select('*')
    .eq('device_id', deviceId)
    .maybeSingle()

  if (error) throw new Error(error.message)

  const stripe = getStripe()

  if (device?.stripe_subscription_id) {
    let subscription = await stripe.subscriptions.retrieve(device.stripe_subscription_id as string)
    subscription = await ensureFullStripeSubscription(stripe, subscription)
    const customerId =
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
    const status = await syncBillingDeviceFromSubscription(admin, deviceId, subscription, customerId)
    return { synced: true, status }
  }

  if (device?.stripe_customer_id) {
    const subscriptions = await stripe.subscriptions.list({
      customer: device.stripe_customer_id as string,
      status: 'all',
      limit: 10,
    })
    const preferred =
      subscriptions.data.find((row) => row.status === 'active' || row.status === 'trialing') ??
      subscriptions.data[0]
    if (!preferred) return { synced: false, status: device ? rowToStatusFromDb(device) : null }

    const customerId =
      typeof preferred.customer === 'string' ? preferred.customer : preferred.customer.id
    const status = await syncBillingDeviceFromSubscription(admin, deviceId, preferred, customerId)
    return { synced: true, status }
  }

  return { synced: false, status: device ? rowToStatusFromDb(device) : null }
}

export async function fetchBillingDeviceStatus(
  admin: SupabaseClient,
  deviceId: string,
): Promise<BillingDeviceStatus | null> {
  const { data, error } = await admin
    .from('billing_devices')
    .select('*')
    .eq('device_id', deviceId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return rowToStatusFromDb(data)
}

function rowToStatus(deviceId: string, patch: Record<string, unknown>): BillingDeviceStatus {
  const plan = patch.plan === 'plus' ? 'plus' : 'free'
  const plusUntil = typeof patch.plus_until === 'string' ? patch.plus_until : null
  const subscriptionStatus =
    typeof patch.subscription_status === 'string' ? patch.subscription_status : null
  const periodEndUnix = plusUntil ? Math.floor(new Date(plusUntil).getTime() / 1000) : null
  const plusActive =
    plan === 'plus' &&
    isPlusEntitledFromSubscription(subscriptionStatus ?? 'unknown', periodEndUnix)

  return {
    deviceId,
    plan,
    plusActive,
    customerId: typeof patch.stripe_customer_id === 'string' ? patch.stripe_customer_id : null,
    subscriptionId:
      typeof patch.stripe_subscription_id === 'string' ? patch.stripe_subscription_id : null,
    subscriptionStatus,
    plusUntil,
    cancelAtPeriodEnd: patch.cancel_at_period_end === true,
  }
}

function rowToStatusFromDb(row: Record<string, unknown>): BillingDeviceStatus {
  const plan = row.plan === 'plus' ? 'plus' : 'free'
  const plusUntil = typeof row.plus_until === 'string' ? row.plus_until : null
  const subscriptionStatus =
    typeof row.subscription_status === 'string' ? row.subscription_status : null
  const periodEndUnix = plusUntil ? Math.floor(new Date(plusUntil).getTime() / 1000) : null

  return {
    deviceId: String(row.device_id),
    plan,
    plusActive:
      plan === 'plus' &&
      isPlusEntitledFromSubscription(subscriptionStatus ?? 'unknown', periodEndUnix),
    customerId: typeof row.stripe_customer_id === 'string' ? row.stripe_customer_id : null,
    subscriptionId:
      typeof row.stripe_subscription_id === 'string' ? row.stripe_subscription_id : null,
    subscriptionStatus,
    plusUntil,
    cancelAtPeriodEnd: row.cancel_at_period_end === true,
  }
}
