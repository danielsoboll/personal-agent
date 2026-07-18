import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const RECOVERY_CODE_SEGMENT_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

function randomSegment(length: number): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += RECOVERY_CODE_SEGMENT_CHARS[bytes[i]! % RECOVERY_CODE_SEGMENT_CHARS.length]
  }
  return out
}

export function generateRecoveryCode(): string {
  return `POST-${randomSegment(4)}-${randomSegment(4)}`
}

export async function generateUniqueRecoveryCode(
  admin: SupabaseClient,
  maxAttempts = 12,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generateRecoveryCode()
    const { data, error } = await admin
      .from('billing_devices')
      .select('device_id')
      .eq('rec_code', code)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data?.device_id) return code
  }
  throw new Error('Kein freier Recovery-Code gefunden.')
}
