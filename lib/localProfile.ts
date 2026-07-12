export const PROFILE_NAME_KEY = 'behoerdenpost.profile.name'

export function getStoredProfileName(): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(PROFILE_NAME_KEY)?.trim() ?? ''
}

export function setStoredProfileName(name: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PROFILE_NAME_KEY, name.trim())
}

export function clearStoredProfileName(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(PROFILE_NAME_KEY)
}
