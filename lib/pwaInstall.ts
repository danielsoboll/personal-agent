export type PwaInstallResult =
  | 'installed'
  | 'dismissed'
  | 'already-installed'
  | 'ios-manual'
  | 'unavailable'

export type PwaInstallPlatform = 'android' | 'iphone' | 'ipad' | 'other'

const PREFERENCE_KEY = 'behoerdenpost-home-screen-icon'
const DAILY_HINT_KEY = 'behoerdenpost-pwa-hint-date'
export const PWA_INSTALL_PROMPT_READY_EVENT = 'behoerdenpost-pwa-install-prompt-ready'

/** Kurz warten, bevor der Tages-Hinweis erscheint. */
export const PWA_DAILY_HINT_DELAY_MS = 45_000

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null
let listenerAttached = false

export function berlinDateKey(now = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now))
}

export function loadHomeScreenIconPreference(): 'yes' | 'no' | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(PREFERENCE_KEY)?.trim().toLowerCase()
  return raw === 'yes' || raw === 'no' ? raw : null
}

export function saveHomeScreenIconPreference(value: 'yes' | 'no'): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PREFERENCE_KEY, value)
}

export function markPwaHintHandledToday(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DAILY_HINT_KEY, berlinDateKey())
}

export function wasPwaHintHandledToday(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(DAILY_HINT_KEY) === berlinDateKey()
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIpadDevice(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  if (/ipad/i.test(ua)) return true
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

export function isIphoneDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /iphone|ipod/i.test(window.navigator.userAgent)
}

export function isIosDevice(): boolean {
  return isIphoneDevice() || isIpadDevice()
}

export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /android/i.test(window.navigator.userAgent)
}

export function getPwaInstallPlatform(): PwaInstallPlatform {
  if (isAndroidDevice()) return 'android'
  if (isIpadDevice()) return 'ipad'
  if (isIphoneDevice()) return 'iphone'
  return 'other'
}

export function canShowNativeInstallPrompt(): boolean {
  return deferredInstallPrompt !== null
}

function notifyInstallPromptReady(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(PWA_INSTALL_PROMPT_READY_EVENT))
}

export function attachPwaInstallListener(): void {
  if (typeof window === 'undefined' || listenerAttached) return
  listenerAttached = true

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredInstallPrompt = event as BeforeInstallPromptEvent
    notifyInstallPromptReady()
  })

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    recordPwaInstallSuccess()
  })

  if (isStandaloneDisplayMode()) {
    recordPwaInstallSuccess()
  }
}

export function recordPwaInstallSuccess(): void {
  saveHomeScreenIconPreference('yes')
  markPwaHintHandledToday()
}

export function recordPwaInstallLaterChoice(): void {
  markPwaHintHandledToday()
}

export async function requestPwaInstall(): Promise<PwaInstallResult> {
  if (typeof window === 'undefined') return 'unavailable'

  if (isStandaloneDisplayMode()) {
    recordPwaInstallSuccess()
    return 'already-installed'
  }

  if (isIosDevice()) {
    return 'ios-manual'
  }

  if (!deferredInstallPrompt) {
    return 'unavailable'
  }

  try {
    await deferredInstallPrompt.prompt()
    const { outcome } = await deferredInstallPrompt.userChoice
    deferredInstallPrompt = null
    if (outcome === 'accepted') {
      recordPwaInstallSuccess()
      return 'installed'
    }
    return 'dismissed'
  } catch {
    deferredInstallPrompt = null
    return 'unavailable'
  }
}

/** Admin / Einstellungen: Anleitung zeigen, solange nicht als App geöffnet. */
export function shouldShowPwaInstallPromo(): boolean {
  if (typeof window === 'undefined') return false
  return !isStandaloneDisplayMode()
}

/** Sticky-Hinweis: max. 1× pro Berlin-Tag, nur im Browser. */
export function shouldShowPwaInstallDailyHint(): boolean {
  if (typeof window === 'undefined') return false
  if (isStandaloneDisplayMode()) return false
  if (loadHomeScreenIconPreference() === 'yes') return false
  if (wasPwaHintHandledToday()) return false
  return true
}
