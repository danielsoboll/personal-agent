import { NextResponse } from 'next/server'

import { restorePlusFromRecoveryCode } from '@/lib/billingRecoveryServer'
import { isSupabaseEnvConfigured } from '@/lib/supabaseEnv'

type Body = {
  recovery_code?: string
  billing_device_id?: string
}

export async function POST(request: Request) {
  if (!isSupabaseEnvConfigured()) {
    return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 503 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const code = body.recovery_code?.trim()
  const deviceId = body.billing_device_id?.trim()
  if (!code) {
    return NextResponse.json({ error: 'Recovery-Code fehlt.' }, { status: 400 })
  }
  if (!deviceId) {
    return NextResponse.json({ error: 'billing_device_id fehlt.' }, { status: 400 })
  }

  try {
    const restored = await restorePlusFromRecoveryCode(code, deviceId)
    return NextResponse.json({
      ok: true,
      deviceId: restored.deviceId,
      plan: restored.plan,
      plusActive: restored.plusActive,
      customerId: restored.customerId,
      subscriptionId: restored.subscriptionId,
      subscriptionStatus: restored.subscriptionStatus,
      plusUntil: restored.plusUntil,
      cancelAtPeriodEnd: restored.cancelAtPeriodEnd,
      rebound: restored.rebound,
    })
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Wiederherstellung fehlgeschlagen.'
    const notFound =
      message.includes('nicht gefunden') ||
      message.includes('Ungültiges Code-Format') ||
      message.includes('kein aktives PLUS')
    return NextResponse.json({ error: message }, { status: notFound ? 404 : 502 })
  }
}
