import { NextResponse } from 'next/server'

import type { ActivityAction } from '@/lib/activityLog'
import { invokeSupabaseEdgeFunction } from '@/lib/supabaseEdgeFunctions'
import { isSupabaseEnvConfigured } from '@/lib/supabaseEnv'

type ActivityLogBody = {
  device_id?: string
  first_name?: string
  action?: ActivityAction
  detail?: Record<string, string | number | boolean | null> | null
}

export async function POST(request: Request) {
  if (!isSupabaseEnvConfigured()) {
    return NextResponse.json({ ok: false, skipped: true }, { status: 202 })
  }

  let body: ActivityLogBody = {}
  try {
    body = (await request.json()) as ActivityLogBody
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const deviceId = body.device_id?.trim()
  const action = body.action?.trim()

  if (!deviceId || !action) {
    return NextResponse.json({ error: 'device_id und action fehlen.' }, { status: 400 })
  }

  try {
    await invokeSupabaseEdgeFunction('log-activity', {
      device_id: deviceId,
      first_name: body.first_name?.trim() || 'Nutzer',
      action,
      detail: body.detail ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Protokoll fehlgeschlagen.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
