import { createClient } from '@supabase/supabase-js'

/** Nur serverseitig — z. B. API-Routen oder Vercel-Fallbacks. */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase Admin ist nicht konfiguriert. Setze NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY.',
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
