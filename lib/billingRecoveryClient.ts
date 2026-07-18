import { getOrCreateBillingDeviceId } from '@/lib/billingDevice'
import { applyServerBillingState } from '@/lib/plusBillingStorage'
import {
  normalizeRecoveryCodeInput,
  RECOVERY_RESTORE_MAX_ATTEMPTS,
} from '@/lib/recoveryCode'

export { RECOVERY_RESTORE_MAX_ATTEMPTS }

type EnsureResponse = {
  ok?: boolean
  available?: boolean
  recCode?: string | null
  recCodeOk?: boolean
  reason?: string | null
  error?: string
}

type RestoreResponse = {
  ok?: boolean
  deviceId?: string
  plan?: 'free' | 'plus'
  plusActive?: boolean
  customerId?: string | null
  subscriptionId?: string | null
  subscriptionStatus?: string | null
  plusUntil?: string | null
  cancelAtPeriodEnd?: boolean
  rebound?: boolean
  error?: string
}

export async function fetchBillingRecoveryCode(): Promise<{
  available: boolean
  recCode: string | null
  recCodeOk: boolean
  reason: string | null
}> {
  const response = await fetch('/api/billing/recovery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'ensure',
      billing_device_id: getOrCreateBillingDeviceId(),
    }),
  })

  const payload = (await response.json()) as EnsureResponse
  if (!response.ok) {
    throw new Error(payload.error ?? 'Recovery-Code konnte nicht geladen werden.')
  }

  return {
    available: payload.available === true,
    recCode: typeof payload.recCode === 'string' ? payload.recCode : null,
    recCodeOk: payload.recCodeOk === true,
    reason: typeof payload.reason === 'string' ? payload.reason : null,
  }
}

export async function markBillingRecoveryCodeDoneClient(): Promise<void> {
  const response = await fetch('/api/billing/recovery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'done',
      billing_device_id: getOrCreateBillingDeviceId(),
    }),
  })

  const payload = (await response.json()) as { error?: string }
  if (!response.ok) {
    throw new Error(payload.error ?? 'Speichern fehlgeschlagen.')
  }
}

/** Bindet PLUS an DIESES Gerät; altes Gerät verliert den Zugang. */
export async function restorePlusWithRecoveryCode(rawCode: string): Promise<{ rebound: boolean }> {
  const deviceId = getOrCreateBillingDeviceId()
  const response = await fetch('/api/billing/recovery-restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recovery_code: normalizeRecoveryCodeInput(rawCode),
      billing_device_id: deviceId,
    }),
  })

  const payload = (await response.json()) as RestoreResponse
  if (!response.ok || !payload.deviceId) {
    throw new Error(payload.error ?? 'Wiederherstellung fehlgeschlagen.')
  }

  applyServerBillingState({
    plusActive: payload.plusActive === true,
    plan: payload.plan === 'plus' ? 'plus' : 'free',
    customerId: payload.customerId ?? null,
    subscriptionId: payload.subscriptionId ?? null,
    subscriptionStatus: payload.subscriptionStatus ?? null,
    plusUntil: payload.plusUntil ?? null,
    cancelAtPeriodEnd: payload.cancelAtPeriodEnd === true,
  })

  return { rebound: payload.rebound === true }
}
