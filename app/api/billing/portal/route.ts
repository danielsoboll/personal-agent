import { NextResponse } from 'next/server'

import { PLUS_CHECKOUT_UNAVAILABLE } from '@/lib/plusFeatures'

export async function POST() {
  const stripeSecret = process.env.STRIPE_SECRET_KEY

  if (!stripeSecret) {
    return NextResponse.json({ error: PLUS_CHECKOUT_UNAVAILABLE }, { status: 503 })
  }

  return NextResponse.json(
    { error: 'Stripe-Kundenportal ist vorbereitet, aber noch nicht implementiert.' },
    { status: 501 },
  )
}
