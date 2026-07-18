import { NextResponse } from 'next/server'

import {
  ensureBillingRecoveryCode,
  markBillingRecoveryCodeDone,
} from '@/lib/billingRecoveryServer'
import { isSupabaseEnvConfigured } from '@/lib/supabaseEnv'

type Body = {
  action?: 'ensure' | 'done'
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

  const deviceId = body.billing_device_id?.trim()
  if (!deviceId) {
    return NextResponse.json({ error: 'billing_device_id fehlt.' }, { status: 400 })
  }

  const action = body.action === 'done' ? 'done' : 'ensure'

  try {
    if (action === 'done') {
      await markBillingRecoveryCodeDone(deviceId)
      return NextResponse.json({ ok: true, recCodeOk: true })
    }

    const result = await ensureBillingRecoveryCode(deviceId)
    return NextResponse.json({
      ok: true,
      available: result.available,
      recCode: result.recCode,
      recCodeOk: result.recCodeOk,
      reason: result.reason ?? null,
    })
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Recovery-Code fehlgeschlagen.'
    const missingColumn =
      message.toLowerCase().includes('rec_code') && message.toLowerCase().includes('column')
    return NextResponse.json(
      {
        error: missingColumn
          ? 'Recovery-Code noch nicht freigeschaltet — Datenbank-Migration fehlt.'
          : message,
      },
      { status: missingColumn ? 503 : 502 },
    )
  }
}
