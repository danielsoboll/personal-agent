import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { syncBillingDeviceFromCheckoutSession } from '../_shared/billingDeviceSync.ts'
import { getStripe } from '../_shared/billingStripe.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { getServiceClient } from '../_shared/supabase.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = (await req.json()) as { sessionId?: string }
    const sessionId = body.sessionId?.trim()
    if (!sessionId) {
      return jsonResponse({ error: 'sessionId is required' }, 400)
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    const paymentStatus = session.payment_status ?? null
    const sessionStatus = session.status ?? null
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id ?? null
    const isComplete = sessionStatus === 'complete'

    let plusSynced = false
    const paid =
      paymentStatus === 'paid' || paymentStatus === 'no_payment_required'

    if (isComplete && paid) {
      try {
        const admin = getServiceClient()
        const syncResult = await syncBillingDeviceFromCheckoutSession(admin, session)
        plusSynced = syncResult.synced
      } catch (syncError) {
        console.warn('verify-checkout-session sync failed', syncError)
      }
    }

    return jsonResponse({
      ok: true,
      isComplete,
      paymentStatus,
      sessionStatus,
      customerId,
      subscriptionId,
      plus_synced: plusSynced,
    })
  } catch (error) {
    console.error('verify-checkout-session', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      500,
    )
  }
})
