import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import {
  fetchBillingDeviceStatus,
  syncBillingDeviceFromStripeByDeviceId,
} from '../_shared/billingDeviceSync.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { getServiceClient } from '../_shared/supabase.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { billing_device_id?: string }
    const deviceId = body.billing_device_id?.trim()
    if (!deviceId) {
      return jsonResponse({ error: 'billing_device_id is required' }, 400)
    }

    const admin = getServiceClient()
    const { synced, status } = await syncBillingDeviceFromStripeByDeviceId(admin, deviceId)
    const resolved = status ?? (await fetchBillingDeviceStatus(admin, deviceId))

    return jsonResponse({
      ok: true,
      synced,
      plan: resolved?.plan ?? 'free',
      plusActive: resolved?.plusActive ?? false,
      customerId: resolved?.customerId ?? null,
      subscriptionId: resolved?.subscriptionId ?? null,
      subscriptionStatus: resolved?.subscriptionStatus ?? null,
      plusUntil: resolved?.plusUntil ?? null,
      cancelAtPeriodEnd: resolved?.cancelAtPeriodEnd ?? false,
    })
  } catch (error) {
    console.error('sync-family-billing', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      500,
    )
  }
})
