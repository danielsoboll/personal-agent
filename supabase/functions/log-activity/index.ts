import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { getServiceClient } from '../_shared/supabase.ts'

const ACTION_PATTERN = /^[a-z0-9_]{1,64}$/

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = (await req.json()) as {
      device_id?: string
      first_name?: string
      action?: string
      detail?: Record<string, unknown> | null
    }

    const deviceId = body.device_id?.trim()
    const action = body.action?.trim()
    const firstName = body.first_name?.trim() || 'Nutzer'

    if (!deviceId || !action) {
      return jsonResponse({ error: 'device_id and action are required' }, 400)
    }

    if (!ACTION_PATTERN.test(action)) {
      return jsonResponse({ error: 'Invalid action' }, 400)
    }

    if (deviceId.length > 128 || firstName.length > 120) {
      return jsonResponse({ error: 'Invalid payload' }, 400)
    }

    const admin = getServiceClient()
    const { error } = await admin.from('activity_log').insert({
      device_id: deviceId,
      first_name: firstName,
      action,
      detail: body.detail ?? null,
    })

    if (error) throw new Error(error.message)

    return jsonResponse({ ok: true })
  } catch (error) {
    console.error('log-activity', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      500,
    )
  }
})
