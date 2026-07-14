const PRODUCTION_SITE_URL = 'https://post.life-xp.de'

const ALLOWED_SITE_HOSTS = new Set([
  'post.life-xp.de',
  'www.post.life-xp.de',
  'localhost',
  '127.0.0.1',
])

function normalizeSiteUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    const host = url.hostname.toLowerCase()
    if (!ALLOWED_SITE_HOSTS.has(host) && !host.endsWith('.vercel.app')) return null
    return url.origin.replace(/\/$/, '')
  } catch {
    return null
  }
}

export function resolveSiteUrl(req: Request, bodySiteUrl?: string | null): string {
  const fromBody = normalizeSiteUrl(bodySiteUrl)
  if (fromBody) return fromBody

  const fromEnv = normalizeSiteUrl(Deno.env.get('SITE_URL'))
  if (fromEnv) return fromEnv

  const fromOrigin = normalizeSiteUrl(req.headers.get('origin'))
  if (fromOrigin) return fromOrigin

  const referer = req.headers.get('referer')
  if (referer) {
    try {
      const fromReferer = normalizeSiteUrl(new URL(referer).origin)
      if (fromReferer) return fromReferer
    } catch {
      /* ignore */
    }
  }

  return PRODUCTION_SITE_URL
}

export function requireStripePriceId(inputPriceId?: string | null): string {
  const fromBody = inputPriceId?.trim()
  if (fromBody) return fromBody

  const fromEnv = Deno.env.get('STRIPE_PRICE_ID')?.trim()
  if (fromEnv) return fromEnv

  throw new Error('priceId is required')
}

function requireStripeSecretKey(): string {
  const secret = Deno.env.get('STRIPE_SECRET_KEY')?.trim()
  if (!secret) throw new Error('STRIPE_SECRET_KEY missing')
  return secret
}

type StripeApiError = { error?: { message?: string } }

export async function createCheckoutSessionViaFetch(input: {
  priceId: string
  siteUrl: string
  clientReferenceId?: string | null
  metadata?: Record<string, string>
}): Promise<{ id: string; url: string | null; status: string | null }> {
  const fields: Record<string, string> = {
    mode: 'subscription',
    'line_items[0][price]': input.priceId,
    'line_items[0][quantity]': '1',
    success_url: `${input.siteUrl}/plus/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.siteUrl}/plus/cancel`,
  }

  if (input.clientReferenceId) {
    fields.client_reference_id = input.clientReferenceId
    fields['subscription_data[metadata][billing_device_id]'] = input.clientReferenceId
  }

  for (const [key, value] of Object.entries(input.metadata ?? {})) {
    fields[`metadata[${key}]`] = value
  }

  const secret = requireStripeSecretKey()
  const body = new URLSearchParams(fields)
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const json = (await res.json()) as { id?: string; url?: string | null; status?: string | null } & StripeApiError
  if (!res.ok) {
    throw new Error(json.error?.message ?? 'Stripe Checkout fehlgeschlagen.')
  }
  if (!json.id) throw new Error('Stripe Checkout-Antwort ungültig.')
  return { id: json.id, url: json.url ?? null, status: json.status ?? null }
}

export async function retrieveCheckoutSession(sessionId: string): Promise<Record<string, unknown>> {
  const secret = requireStripeSecretKey()
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  })
  const json = (await res.json()) as Record<string, unknown> & StripeApiError
  if (!res.ok) {
    throw new Error(json.error?.message ?? 'Checkout-Sitzung konnte nicht geladen werden.')
  }
  return json
}

export async function createPortalSessionViaFetch(input: {
  customerId: string
  siteUrl: string
}): Promise<{ url: string }> {
  const secret = requireStripeSecretKey()
  const body = new URLSearchParams({
    customer: input.customerId,
    return_url: `${input.siteUrl}/`,
  })

  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const json = (await res.json()) as { url?: string } & StripeApiError
  if (!res.ok) {
    throw new Error(json.error?.message ?? 'Stripe Portal fehlgeschlagen.')
  }
  if (!json.url) throw new Error('Portal-URL fehlt.')
  return { url: json.url }
}
