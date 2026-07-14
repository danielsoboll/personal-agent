import { NextResponse } from 'next/server'

import type { BillingApiBody } from '@/lib/billingTypes'
import { resolveBillingSiteOrigin } from '@/lib/billingSiteOrigin'
import { PLUS_CHECKOUT_UNAVAILABLE } from '@/lib/plusFeatures'
import { invokeSupabaseEdgeFunction } from '@/lib/supabaseEdgeFunctions'
import { isSupabaseEnvConfigured } from '@/lib/supabaseEnv'

export async function POST(request: Request) {
  if (!isSupabaseEnvConfigured()) {
    return NextResponse.json({ error: PLUS_CHECKOUT_UNAVAILABLE }, { status: 503 })
  }

  let body: BillingApiBody = {}
  try {
    body = (await request.json()) as BillingApiBody
  } catch {
    body = {}
  }

  const customerId = body.customer_id?.trim()
  if (!customerId) {
    return NextResponse.json({ error: 'Stripe-Kunde fehlt — zuerst PLUS aktivieren.' }, { status: 400 })
  }

  const siteUrl = resolveBillingSiteOrigin(request, body.site_url)

  try {
    const edge = await invokeSupabaseEdgeFunction<{ url?: string }>('create-customer-portal-session', {
      customerId,
      siteUrl,
    })

    if (!edge.url) {
      return NextResponse.json({ error: 'Portal-URL fehlt.' }, { status: 502 })
    }

    return NextResponse.json({ url: edge.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kundenportal konnte nicht geöffnet werden.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
