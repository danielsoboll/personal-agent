const LOCAL_DEV_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

export function isLocalDevHost(hostname: string): boolean {
  return LOCAL_DEV_HOSTS.has(hostname.trim().toLowerCase())
}

export function isLocalDevClient(): boolean {
  if (typeof window === 'undefined') return false
  return isLocalDevHost(window.location.hostname)
}
