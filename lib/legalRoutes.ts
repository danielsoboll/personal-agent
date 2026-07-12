export const PUBLIC_LEGAL_PATHS = ['/impressum', '/datenschutz', '/haftung', '/agb'] as const

export type PublicLegalPath = (typeof PUBLIC_LEGAL_PATHS)[number]

export function isPublicLegalPath(pathname: string): boolean {
  return PUBLIC_LEGAL_PATHS.includes(pathname as PublicLegalPath)
}
