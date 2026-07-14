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

/** Stripe success/cancel URLs — bevorzugt Client-Origin, dann Env, dann Produktion. */
export function resolveBillingSiteOrigin(request?: Request, bodySiteUrl?: string | null): string {
  const fromBody = normalizeSiteUrl(bodySiteUrl)
  if (fromBody) return fromBody

  const fromEnv = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL)
  if (fromEnv) return fromEnv

  if (request) {
    const fromOrigin = normalizeSiteUrl(request.headers.get('origin'))
    if (fromOrigin) return fromOrigin

    const referer = request.headers.get('referer')
    if (referer) {
      try {
        const fromReferer = normalizeSiteUrl(new URL(referer).origin)
        if (fromReferer) return fromReferer
      } catch {
        /* ignore */
      }
    }
  }

  return PRODUCTION_SITE_URL
}
