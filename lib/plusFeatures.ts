import { APP_NAME } from '@/lib/appIcon'

export type PlusFeature = {
  id: string
  emoji: string
  title: string
  description: string
}

export const PLUS_PRODUCT_NAME = `${APP_NAME} PLUS`

/** Schloss-Button: Einladung, kein Blocker — wie LifeXP Family. */
export const PLUS_DISCOVER_LABEL = 'PLUS entdecken'

export const PLUS_TAGLINE = PLUS_DISCOVER_LABEL

export const PLUS_PRICE_AMOUNT = '9,99 €'
export const PLUS_PRICE_PERIOD = 'pro Monat'
export const PLUS_PRICE_TAGLINE = 'Alles inklusive.'

export const PLUS_ABO_SLOGAN = 'Dauerhafter Helfer für Behördenpost.'
export const PLUS_CANCEL_NOTE = 'Jederzeit kündbar.'

export const PLUS_CTA_LABEL = 'PLUS entdecken'

export const PLUS_ACTIVE_HEADER_LABEL = 'PLUS'
export const PLUS_ACTIVE_HEADER_HINT = 'PLUS — Tippen für Überblick'

export const PLUS_CHECKOUT_UNAVAILABLE = 'Checkout bald verfügbar.'

export const PLUS_MOTIVATION_TITLE = 'Dauerhafter Helfer für deine Fälle'
export const PLUS_MOTIVATION_INTRO = 'Historie statt jedes Mal neu.'

export const PLUS_SHEET = {
  titleFree: PLUS_MOTIVATION_TITLE,
  titleActive: 'PLUS ist aktiv',
  introFree: PLUS_MOTIVATION_INTRO,
  introActive: 'Alle PLUS-Funktionen frei.',
} as const

export const PLUS_PURCHASE_CONFIRMATION = {
  headline: 'PLUS gekauft.',
  subline: 'Ab jetzt arbeiten wir zusammen.',
  body: [] as string[],
} as const

export const PLUS_ACTIVE_WELCOME = {
  headline: 'PLUS ist aktiv.',
  body: [] as string[],
  availableHeading: 'Bereits verfügbar',
  availableItems: [
    { emoji: '📁', label: 'Mehr Fälle & Historie' },
    { emoji: '⚡', label: 'Monatslimits für KI' },
    { emoji: '☁️', label: 'Cloud-Sicherung (folgt)' },
  ],
} as const

export const PLUS_FEATURES: PlusFeature[] = [
  {
    id: 'agent',
    emoji: '🤖',
    title: 'Dauerhafter KI-Helfer',
    description: 'Merkt sich Fälle und Verlauf.',
  },
  {
    id: 'cases',
    emoji: '📁',
    title: 'Bis zu 10 Fälle',
    description: 'Mehrere Themen parallel.',
  },
  {
    id: 'cloud',
    emoji: '☁️',
    title: 'Optional: Cloud',
    description: 'Sichern und Gerät wechseln.',
  },
  {
    id: 'limits',
    emoji: '⚡',
    title: '100 KI-Anfragen / Monat',
    description: 'Für Analyse und Schreiben.',
  },
  {
    id: 'history',
    emoji: '📚',
    title: 'Dauerhafte Historie',
    description: 'Auswertungen bleiben verfügbar.',
  },
]

export const PLUS_LIMITS_SUMMARY = '10 Fälle · 100 KI/Monat · Cloud optional'

export const PLUS_TARIF_LINE_FREE = 'Gratis: ein Fall, lokal auf dem Gerät.'
export const PLUS_TARIF_LINE_PLUS = `${PLUS_PRODUCT_NAME} · ${PLUS_PRICE_AMOUNT} ${PLUS_PRICE_PERIOD}`
