import { NextResponse } from 'next/server'

import type { BillingApiBody, CheckoutSessionResponse } from '@/lib/billingTypes'
import { resolveBillingSiteOrigin } from '@/lib/billingSiteOrigin'
import { PLUS_CHECKOUT_UNAVAILABLE } from '@/lib/plusFeatures'
import { invokeSupabaseEdgeFunction } from '@/lib/supabaseEdgeFunctions'
import { isSupabaseEnvConfigured } from '@/lib/supabaseEnv'

function resolveStripePriceId(): string | null {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ID?.trim() ||
    process.env.STRIPE_PRICE_ID?.trim() ||
    null
  )
}

export async function POST(request: Request) {
  const priceId = resolveStripePriceId()
  if (!isSupabaseEnvConfigured() || !priceId) {
    return NextResponse.json({ error: PLUS_CHECKOUT_UNAVAILABLE }, { status: 503 })
  }

  let body: BillingApiBody = {}
  try {
    body = (await request.json()) as BillingApiBody
  } catch {
    body = {}
  }

  const siteUrl = resolveBillingSiteOrigin(request, body.site_url)
  const billingDeviceId = body.billing_device_id?.trim()

  try {
    const edge = await invokeSupabaseEdgeFunction<CheckoutSessionResponse>('create-checkout-session', {
      priceId,
      siteUrl,
      ...(billingDeviceId
        ? {
            clientReferenceId: billingDeviceId,
            metadata: { billing_device_id: billingDeviceId },
          }
        : {}),
    })

    if (!edge.url) {
      return NextResponse.json({ error: 'Checkout-URL fehlt.' }, { status: 502 })
    }

    return NextResponse.json({ url: edge.url, sessionId: edge.id ?? null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout fehlgeschlagen.'
    const status = message.includes('Live vs. Test') ? 500 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
