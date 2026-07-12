export const DRAFT_CASE_TITLE_KEY = 'behoerdenpost.draftCaseTitle'
const DRAFT_COOKIE_KEY = 'behoerdenpost_d'

function readDraftCookie(): string {
  if (typeof document === 'undefined') return ''
  const prefix = `${DRAFT_COOKIE_KEY}=`
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length)).trim()
    }
  }
  return ''
}

function writeDraftCookie(title: string): void {
  if (typeof document === 'undefined') return
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${DRAFT_COOKIE_KEY}=${encodeURIComponent(title)}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax${secure}`
}

function clearDraftCookie(): void {
  if (typeof document === 'undefined') return
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${DRAFT_COOKIE_KEY}=; path=/; max-age=0${secure}`
}

export function getDraftFromUrl(): string {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('draft')?.trim() ?? ''
}

export function getDraftCaseTitle(): string {
  if (typeof window === 'undefined') return ''

  const fromUrl = getDraftFromUrl()
  if (fromUrl) return fromUrl

  try {
    const fromSession = window.sessionStorage.getItem(DRAFT_CASE_TITLE_KEY)?.trim()
    if (fromSession) return fromSession
  } catch {
    /* iOS Privatmodus / blockiert */
  }

  try {
    const fromLocal = window.localStorage.getItem(DRAFT_CASE_TITLE_KEY)?.trim()
    if (fromLocal) return fromLocal
  } catch {
    /* ignore */
  }

  return readDraftCookie()
}

export function setDraftCaseTitle(title: string): void {
  if (typeof window === 'undefined') return
  const value = title.trim()
  if (!value) return

  writeDraftCookie(value)

  try {
    window.sessionStorage.setItem(DRAFT_CASE_TITLE_KEY, value)
  } catch {
    /* Cookie reicht als Fallback */
  }

  try {
    window.localStorage.setItem(DRAFT_CASE_TITLE_KEY, value)
  } catch {
    /* ignore */
  }
}

export function clearDraftCaseTitle(): void {
  if (typeof window === 'undefined') return
  clearDraftCookie()
  try {
    window.sessionStorage.removeItem(DRAFT_CASE_TITLE_KEY)
  } catch {
    /* ignore */
  }
  try {
    window.localStorage.removeItem(DRAFT_CASE_TITLE_KEY)
  } catch {
    /* ignore */
  }
}
