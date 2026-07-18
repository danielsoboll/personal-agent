import { createSupabaseAdmin } from '@/lib/supabaseAdmin'
import { isPlusEntitled } from '@/lib/plusEntitlement'
import {
  generateRecoveryCode,
  isValidRecoveryCodeFormat,
  normalizeRecoveryCodeInput,
} from '@/lib/recoveryCode'
import { invokeSupabaseEdgeFunction } from '@/lib/supabaseEdgeFunctions'

export type BillingDeviceRecoveryRow = {
  device_id: string
  profile_id?: string | null
  plan: 'free' | 'plus' | string | null
  subscription_status: string | null
  plus_until: string | null
  cancel_at_period_end: boolean | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  rec_code: string | null
  rec_code_ok: boolean | null
}

function rowIsPlus(row: BillingDeviceRecoveryRow): boolean {
  return isPlusEntitled({
    plan: row.plan === 'plus' ? 'plus' : 'free',
    plusUntil: row.plus_until,
    subscriptionStatus: row.subscription_status,
    cancelAtPeriodEnd: row.cancel_at_period_end === true,
  })
}

async function isRecoveryCodeTaken(code: string): Promise<boolean> {
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('billing_devices')
    .select('device_id')
    .eq('rec_code', code)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return Boolean(data?.device_id)
}

export async function generateUniqueBillingRecoveryCode(maxAttempts = 12): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generateRecoveryCode()
    if (!(await isRecoveryCodeTaken(code))) return code
  }
  throw new Error('Kein freier Recovery-Code gefunden. Bitte erneut versuchen.')
}

export async function ensureBillingRecoveryCode(deviceId: string): Promise<{
  available: boolean
  recCode: string | null
  recCodeOk: boolean
  reason?: 'no_device' | 'no_plus'
}> {
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('billing_devices')
    .select(
      'device_id, plan, subscription_status, plus_until, cancel_at_period_end, stripe_customer_id, stripe_subscription_id, rec_code, rec_code_ok',
    )
    .eq('device_id', deviceId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) {
    return { available: false, recCode: null, recCodeOk: false, reason: 'no_device' }
  }

  const row = data as BillingDeviceRecoveryRow
  if (!rowIsPlus(row)) {
    return { available: false, recCode: null, recCodeOk: false, reason: 'no_plus' }
  }

  let recCode = typeof row.rec_code === 'string' && row.rec_code.trim() ? row.rec_code.trim() : null
  if (!recCode) {
    recCode = await generateUniqueBillingRecoveryCode()
    const { error: updateError } = await admin
      .from('billing_devices')
      .update({ rec_code: recCode, rec_code_ok: false, updated_at: new Date().toISOString() })
      .eq('device_id', deviceId)
    if (updateError) throw new Error(updateError.message)
    return { available: true, recCode, recCodeOk: false }
  }

  return { available: true, recCode, recCodeOk: row.rec_code_ok === true }
}

export async function markBillingRecoveryCodeDone(deviceId: string): Promise<void> {
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('billing_devices')
    .select('rec_code')
    .eq('device_id', deviceId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data?.rec_code) {
    throw new Error('Kein Recovery-Code für dieses Gerät.')
  }

  const { error: updateError } = await admin
    .from('billing_devices')
    .update({ rec_code_ok: true, updated_at: new Date().toISOString() })
    .eq('device_id', deviceId)

  if (updateError) throw new Error(updateError.message)
}

/**
 * PLUS vom alten Gerät auf dieses Gerät umbinden.
 * Altes Gerät verliert den Eintrag → Sync dort deaktiviert PLUS.
 * Stripe-Abo bleibt (customer/subscription), Metadata zeigt auf neues Gerät.
 */
export async function restorePlusFromRecoveryCode(
  rawCode: string,
  newDeviceId: string,
): Promise<{
  deviceId: string
  plan: 'free' | 'plus'
  plusActive: boolean
  customerId: string | null
  subscriptionId: string | null
  subscriptionStatus: string | null
  plusUntil: string | null
  cancelAtPeriodEnd: boolean
  rebound: boolean
}> {
  const code = normalizeRecoveryCodeInput(rawCode)
  if (!isValidRecoveryCodeFormat(code)) {
    throw new Error('Ungültiges Code-Format. Beispiel: POST-7K3P-92XQ')
  }

  const trimmedNewId = newDeviceId.trim()
  if (!trimmedNewId) {
    throw new Error('billing_device_id fehlt.')
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('billing_devices')
    .select(
      'device_id, profile_id, plan, subscription_status, plus_until, cancel_at_period_end, stripe_customer_id, stripe_subscription_id, rec_code, rec_code_ok',
    )
    .eq('rec_code', code)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) {
    throw new Error('Recovery-Code nicht gefunden.')
  }

  const row = data as BillingDeviceRecoveryRow
  if (!rowIsPlus(row)) {
    throw new Error('Zu diesem Code gehört aktuell kein aktives PLUS.')
  }

  const now = new Date().toISOString()
  let rebound = false

  if (row.device_id !== trimmedNewId) {
    rebound = true

    // Evtl. leere Zeile vom neuen Gerät entfernen (Konflikt auf PK)
    await admin.from('billing_devices').delete().eq('device_id', trimmedNewId)

    const { error: insertError } = await admin.from('billing_devices').insert({
      device_id: trimmedNewId,
      profile_id: row.profile_id ?? null,
      plan: 'plus',
      subscription_status: row.subscription_status,
      plus_until: row.plus_until,
      cancel_at_period_end: row.cancel_at_period_end === true,
      stripe_customer_id: row.stripe_customer_id,
      stripe_subscription_id: row.stripe_subscription_id,
      rec_code: row.rec_code,
      rec_code_ok: row.rec_code_ok === true,
      updated_at: now,
    })
    if (insertError) throw new Error(insertError.message)

    // Altes Gerät: PLUS und Stripe-Bindung weg — Sync dort → kostenlos
    const { error: deleteError } = await admin
      .from('billing_devices')
      .delete()
      .eq('device_id', row.device_id)
    if (deleteError) throw new Error(deleteError.message)

    if (row.stripe_subscription_id) {
      try {
        await invokeSupabaseEdgeFunction('billing-recovery', {
          action: 'bind_subscription_device',
          subscription_id: row.stripe_subscription_id,
          billing_device_id: trimmedNewId,
        })
      } catch (stripeError) {
        // DB ist umgebunden; Webhook-Resolve bevorzugt subscription_id in der DB.
        console.warn('Stripe device bind after recovery failed:', stripeError)
      }
    }
  }

  return {
    deviceId: trimmedNewId,
    plan: 'plus',
    plusActive: true,
    customerId: row.stripe_customer_id,
    subscriptionId: row.stripe_subscription_id,
    subscriptionStatus: row.subscription_status,
    plusUntil: row.plus_until,
    cancelAtPeriodEnd: row.cancel_at_period_end === true,
    rebound,
  }
}
