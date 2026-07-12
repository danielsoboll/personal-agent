import { NextResponse } from 'next/server'

import { PLUS_CHECKOUT_UNAVAILABLE } from '@/lib/plusFeatures'

export async function POST() {
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const stripePriceId = process.env.STRIPE_PRICE_ID

  if (!stripeSecret || !stripePriceId) {
    return NextResponse.json({ error: PLUS_CHECKOUT_UNAVAILABLE }, { status: 503 })
  }

  // Stripe Checkout Session — sobald Produkt & Keys hinterlegt sind.
  return NextResponse.json(
    {
      error:
        'Stripe-Checkout ist vorbereitet, aber noch nicht implementiert. Bitte STRIPE_SECRET_KEY und STRIPE_PRICE_ID setzen und Edge Function anbinden.',
    },
    { status: 501 },
  )
}
