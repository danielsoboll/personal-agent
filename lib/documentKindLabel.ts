import type { DocumentKind } from '@/lib/analyzeTypes'

const LABELS: Record<DocumentKind, string> = {
  behoerde: 'Behördenschreiben',
  gericht: 'Gerichtsschreiben',
  anwalt: 'Anwaltsschreiben',
  versicherung: 'Versicherungsschreiben',
  formular: 'Formular',
  sonstiges: 'Schreiben',
}

export function documentKindLabel(kind?: DocumentKind): string | null {
  if (!kind) return null
  return LABELS[kind] ?? null
}
