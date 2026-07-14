import { NextResponse } from 'next/server'

import type { BillingApiBody, BillingSyncResponse } from '@/lib/billingTypes'
import { invokeSupabaseEdgeFunction } from '@/lib/supabaseEdgeFunctions'
import { isSupabaseEnvConfigured } from '@/lib/supabaseEnv'

export async function POST(request: Request) {
  if (!isSupabaseEnvConfigured()) {
    return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 503 })
  }

  let body: BillingApiBody = {}
  try {
    body = (await request.json()) as BillingApiBody
  } catch {
    body = {}
  }

  const billingDeviceId = body.billing_device_id?.trim()
  if (!billingDeviceId) {
    return NextResponse.json({ error: 'billing_device_id fehlt.' }, { status: 400 })
  }

  try {
    const edge = await invokeSupabaseEdgeFunction<BillingSyncResponse>('sync-family-billing', {
      billing_device_id: billingDeviceId,
    })

    return NextResponse.json({
      ok: edge.ok === true,
      synced: edge.synced === true,
      plan: edge.plan === 'plus' ? 'plus' : 'free',
      plusActive: edge.plusActive === true,
      customerId: edge.customerId ?? null,
      subscriptionId: edge.subscriptionId ?? null,
      subscriptionStatus: edge.subscriptionStatus ?? null,
      plusUntil: edge.plusUntil ?? null,
      cancelAtPeriodEnd: edge.cancelAtPeriodEnd === true,
      message: edge.message ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Synchronisation fehlgeschlagen.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
