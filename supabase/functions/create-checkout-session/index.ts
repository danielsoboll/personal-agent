import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { createCheckoutSessionViaFetch, requireStripePriceId, resolveSiteUrl } from '../_shared/billing.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = (await req.json()) as {
      priceId?: string
      siteUrl?: string
      clientReferenceId?: string
      metadata?: Record<string, string>
    }

    const priceId = requireStripePriceId(body.priceId)
    const siteUrl = resolveSiteUrl(req, body.siteUrl)
    const session = await createCheckoutSessionViaFetch({
      priceId,
      siteUrl,
      clientReferenceId: body.clientReferenceId ?? null,
      metadata: body.metadata,
    })

    if (!session.url) {
      return jsonResponse({ error: 'Checkout-URL konnte nicht erstellt werden.' }, 500)
    }

    return jsonResponse(session)
  } catch (error) {
    console.error('create-checkout-session', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      500,
    )
  }
})
