export function resolveSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL fehlt.')
  }
  return url
}

export function resolveSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt.')
  }
  return key
}

export function isSupabaseEnvConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim())
}
