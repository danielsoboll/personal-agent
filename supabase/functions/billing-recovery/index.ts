import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { getStripe } from '../_shared/billingStripe.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { getServiceClient } from '../_shared/supabase.ts'
import { generateUniqueRecoveryCode } from '../_shared/recoveryCode.ts'

type Body = {
  action?: 'bind_subscription_device' | 'ensure_recovery_code'
  subscription_id?: string
  billing_device_id?: string
}

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = (await req.json()) as Body
    const action = body.action

    if (action === 'bind_subscription_device') {
      const subscriptionId = body.subscription_id?.trim()
      const deviceId = body.billing_device_id?.trim()
      if (!subscriptionId || !deviceId) {
        return jsonResponse({ error: 'subscription_id und billing_device_id erforderlich.' }, 400)
      }

      const stripe = getStripe()
      await stripe.subscriptions.update(subscriptionId, {
        metadata: { billing_device_id: deviceId },
      })

      return jsonResponse({ ok: true, subscriptionId, billing_device_id: deviceId })
    }

    if (action === 'ensure_recovery_code') {
      const deviceId = body.billing_device_id?.trim()
      if (!deviceId) {
        return jsonResponse({ error: 'billing_device_id erforderlich.' }, 400)
      }

      const admin = getServiceClient()
      const { data, error } = await admin
        .from('billing_devices')
        .select('device_id, plan, plus_until, subscription_status, rec_code, rec_code_ok')
        .eq('device_id', deviceId)
        .maybeSingle()

      if (error) throw new Error(error.message)
      if (!data) {
        return jsonResponse({ ok: true, available: false, reason: 'no_device' })
      }

      if (typeof data.rec_code === 'string' && data.rec_code.trim()) {
        return jsonResponse({
          ok: true,
          available: true,
          recCode: data.rec_code,
          recCodeOk: data.rec_code_ok === true,
        })
      }

      const recCode = await generateUniqueRecoveryCode(admin)
      const { error: updateError } = await admin
        .from('billing_devices')
        .update({ rec_code: recCode, rec_code_ok: false, updated_at: new Date().toISOString() })
        .eq('device_id', deviceId)
      if (updateError) throw new Error(updateError.message)

      return jsonResponse({ ok: true, available: true, recCode, recCodeOk: false })
    }

    return jsonResponse({ error: 'Unbekannte action.' }, 400)
  } catch (error) {
    console.error('billing-recovery', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      500,
    )
  }
})
