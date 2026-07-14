import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno'

export const stripeCryptoProvider = Stripe.createSubtleCryptoProvider()

export function getStripe(): Stripe {
  const secret = Deno.env.get('STRIPE_SECRET_KEY')?.trim()
  if (!secret) throw new Error('STRIPE_SECRET_KEY missing')
  return new Stripe(secret, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })
}
