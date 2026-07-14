import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { createPortalSessionViaFetch, resolveSiteUrl } from '../_shared/billing.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = (await req.json()) as { customerId?: string; siteUrl?: string }
    const customerId = body.customerId?.trim()
    if (!customerId) {
      return jsonResponse({ error: 'customerId is required' }, 400)
    }

    const siteUrl = resolveSiteUrl(req, body.siteUrl)
    const portal = await createPortalSessionViaFetch({ customerId, siteUrl })
    return jsonResponse(portal)
  } catch (error) {
    console.error('create-customer-portal-session', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      500,
    )
  }
})
