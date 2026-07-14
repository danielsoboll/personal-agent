export const APP_NAME = 'Behördenpost'

export const APP_ICON_VERSION = 'behoerdenpost-3'

const APP_ICON_FILES = {
  180: '/icon-180.png',
  192: '/icon-192.png',
  512: '/icon-512.png',
} as const

export const APP_ICON_PATHS = {
  180: `${APP_ICON_FILES[180]}?v=${APP_ICON_VERSION}`,
  192: `${APP_ICON_FILES[192]}?v=${APP_ICON_VERSION}`,
  512: `${APP_ICON_FILES[512]}?v=${APP_ICON_VERSION}`,
} as const

export const APP_MANIFEST_PATH = `/manifest.webmanifest?v=${APP_ICON_VERSION}`

export function getAppIconPath(size: 180 | 192 | 512 = 192): string {
  return APP_ICON_PATHS[size]
}
