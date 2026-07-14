import { NextResponse } from 'next/server'

import type { BillingApiBody, VerifiedCheckoutResponse } from '@/lib/billingTypes'
import { PLUS_CHECKOUT_UNAVAILABLE } from '@/lib/plusFeatures'
import { invokeSupabaseEdgeFunction } from '@/lib/supabaseEdgeFunctions'
import { isSupabaseEnvConfigured } from '@/lib/supabaseEnv'

function isPaidCheckout(payload: VerifiedCheckoutResponse): boolean {
  const paymentStatus = payload.paymentStatus ?? ''
  const sessionStatus = payload.sessionStatus ?? ''
  const complete = payload.isComplete === true || sessionStatus === 'complete'
  const paid = paymentStatus === 'paid' || paymentStatus === 'no_payment_required'
  return complete && paid
}

export async function POST(request: Request) {
  if (!isSupabaseEnvConfigured()) {
    return NextResponse.json({ error: PLUS_CHECKOUT_UNAVAILABLE }, { status: 503 })
  }

  let body: BillingApiBody = {}
  try {
    body = (await request.json()) as BillingApiBody
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const sessionId = body.session_id?.trim()
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id fehlt.' }, { status: 400 })
  }

  try {
    const edge = await invokeSupabaseEdgeFunction<VerifiedCheckoutResponse>('verify-checkout-session', {
      sessionId,
    })

    return NextResponse.json({
      ok: edge.ok === true,
      isComplete: edge.isComplete === true,
      paymentStatus: edge.paymentStatus ?? null,
      sessionStatus: edge.sessionStatus ?? null,
      customerId: edge.customerId ?? null,
      subscriptionId: edge.subscriptionId ?? null,
      plusSynced: edge.plus_synced === true,
      plan: edge.plan === 'plus' ? 'plus' : 'free',
      plusActive: edge.plusActive === true || (edge.plus_synced !== true && isPaidCheckout(edge)),
      subscriptionStatus: edge.subscriptionStatus ?? null,
      plusUntil: edge.plusUntil ?? null,
      cancelAtPeriodEnd: edge.cancelAtPeriodEnd === true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout konnte nicht geprüft werden.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
