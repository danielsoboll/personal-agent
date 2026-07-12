export const THEME_STORAGE_KEY = 'behoerdenpost-theme'
const THEME_COOKIE_KEY = 'behoerdenpost_t'

/** Fallback auf html — sichtbar bevor CSS lädt (iOS/PWA). */
export const THEME_FALLBACK_BG_LIGHT = '#eef2f7'
export const THEME_FALLBACK_BG_DARK = '#0b1220'

export type ThemePreference = 'light' | 'dark'

function readThemeCookie(): string | null {
  if (typeof document === 'undefined') return null
  const prefix = `${THEME_COOKIE_KEY}=`
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length))
    }
  }
  return null
}

function writeThemeCookie(value: ThemePreference): void {
  if (typeof document === 'undefined') return
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${THEME_COOKIE_KEY}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 400}; SameSite=Lax${secure}`
}

export function getStoredTheme(): ThemePreference | null {
  if (typeof window === 'undefined') return null
  try {
    const fromStorage = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (fromStorage === 'light' || fromStorage === 'dark') return fromStorage

    const fromCookie = readThemeCookie()
    if (fromCookie === 'light' || fromCookie === 'dark') {
      window.localStorage.setItem(THEME_STORAGE_KEY, fromCookie)
      return fromCookie
    }

    return null
  } catch {
    return null
  }
}

export function setStoredTheme(mode: ThemePreference): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode)
    writeThemeCookie(mode)
  } catch {
    /* ignore */
  }
}

export function applyDarkClass(dark: boolean): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.backgroundColor = dark
    ? THEME_FALLBACK_BG_DARK
    : THEME_FALLBACK_BG_LIGHT
}

export function resolveInitialDark(): boolean {
  if (typeof window === 'undefined') return false
  const stored = getStoredTheme()
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const themeInitScript = `
(function () {
  try {
    var k = ${JSON.stringify(THEME_STORAGE_KEY)};
    var t = localStorage.getItem(k);
    if (t !== "dark" && t !== "light") {
      var p = ${JSON.stringify(THEME_COOKIE_KEY)} + "=";
      var c = document.cookie.split(";");
      for (var i = 0; i < c.length; i++) {
        var part = c[i].trim();
        if (part.indexOf(p) === 0) {
          t = decodeURIComponent(part.slice(p.length));
          if (t === "dark" || t === "light") localStorage.setItem(k, t);
          break;
        }
      }
    }
    var dark = false;
    if (t === "dark") dark = true;
    else if (t === "light") dark = false;
    else dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.backgroundColor = dark
      ? ${JSON.stringify(THEME_FALLBACK_BG_DARK)}
      : ${JSON.stringify(THEME_FALLBACK_BG_LIGHT)};
  } catch (e) {}
})();
`
