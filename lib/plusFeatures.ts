import { APP_NAME } from '@/lib/appIcon'

export type PlusFeature = {
  id: string
  emoji: string
  title: string
  description: string
}

export const PLUS_PRODUCT_NAME = `${APP_NAME} PLUS`

/** Schloss-Button: Einladung, kein Blocker — wie LifeXP Family. */
export const PLUS_DISCOVER_LABEL =
  'Behördenpost als dauerhafter KI-Agent — mit Historie statt jedes Mal neu im Chatbot anfangen.'

export const PLUS_TAGLINE = PLUS_DISCOVER_LABEL

export const PLUS_PRICE_AMOUNT = '9,99 €'
export const PLUS_PRICE_PERIOD = 'pro Monat'
export const PLUS_PRICE_TAGLINE = 'Ein Preis — alle PLUS-Funktionen inklusive.'

export const PLUS_ABO_SLOGAN = 'Dein dauerhafter Helfer für Behördenpost.'
export const PLUS_CANCEL_NOTE = 'Jederzeit kündbar (monatlich).'

export const PLUS_CTA_LABEL = 'PLUS entdecken!'

export const PLUS_ACTIVE_HEADER_LABEL = 'PLUS'
export const PLUS_ACTIVE_HEADER_HINT =
  'Du hast PLUS gekauft — ab jetzt arbeiten wir zusammen. Tippe für deine Funktionen.'

export const PLUS_CHECKOUT_UNAVAILABLE =
  'PLUS-Checkout startet in Kürze. Stripe ist noch nicht angebunden — wir informieren hier, sobald das Abo buchbar ist.'

export const PLUS_MOTIVATION_TITLE = 'Dein dauerhafter Helfer — nicht nur für einen Brief'
export const PLUS_MOTIVATION_INTRO =
  'Mit Historie, mehr Fällen und echtem Gedächtnis — damit du nicht jedes Mal bei null anfängst wie in einem reinen Chatbot.'


export const PLUS_SHEET = {
  titleFree: PLUS_MOTIVATION_TITLE,
  titleActive: 'Du hast PLUS — ab jetzt arbeiten wir zusammen',
  introFree: PLUS_MOTIVATION_INTRO,
  introActive:
    'Danke für dein Vertrauen. Ich bin an deiner Seite — mit Historie, mehr Fällen und allen PLUS-Funktionen, die schon freigeschaltet sind.',
} as const

export const PLUS_PURCHASE_CONFIRMATION = {
  headline: 'Du hast Behördenpost PLUS gekauft.',
  subline: 'Ab jetzt arbeiten wir zusammen.',
  body: [
    'Ich merke mir deine Fälle und helfe dir dauerhaft — nicht nur für ein einzelnes Schreiben.',
    'Gemeinsam bringen wir Klarheit in deine Behördenpost.',
  ],
} as const

export const PLUS_ACTIVE_WELCOME = {
  headline: 'Ab jetzt arbeiten wir zusammen.',
  body: [
    'Du hast PLUS — ich bin dein dauerhafter Helfer für Behördenpost.',
    'Deine Fälle, Historie und nächsten Schritte bleiben an einem Ort.',
  ],
  availableHeading: 'Heute bereits verfügbar',
  availableItems: [
    { emoji: '📁', label: 'Mehr Fälle & Historie' },
    { emoji: '⚡', label: 'Monatslimits für KI-Anfragen' },
    { emoji: '☁️', label: 'Optionale Cloud-Sicherung (folgt)' },
  ],
} as const

export const PLUS_FEATURES: PlusFeature[] = [
  {
    id: 'agent',
    emoji: '🤖',
    title: 'Dauerhafter KI-Agent',
    description:
      'Behördenpost merkt sich deine Fälle, Fallakten und Verlauf — du startest nicht bei jeder Frage bei null wie in einem reinen Chatbot.',
  },
  {
    id: 'cases',
    emoji: '📁',
    title: 'Bis zu 10 Fälle',
    description: 'Mehrere Themen parallel organisieren — Unterhalt, Steuer, Versicherung, Wohnung und mehr.',
  },
  {
    id: 'cloud',
    emoji: '☁️',
    title: 'Optional: Cloud-Speicher (DSGVO-konform)',
    description:
      'Externe, DSGVO-konforme Persistenz optional — mit Wiederherstellung auf diesem Gerät, wenn du das Handy wechselst oder Daten verlierst.',
  },
  {
    id: 'limits',
    emoji: '⚡',
    title: '100 KI-Anfragen · 500 Seiten Text pro Monat',
    description: 'Großzügige Monatslimits für Analyse, Bewertung und Schreiben — fair kalkuliert für echte Alltagsfälle.',
  },
  {
    id: 'history',
    emoji: '📚',
    title: 'Dauerhafte Historie',
    description:
      'Auswertungen, Schritte und Kontext bleiben verfügbar — massive Zeitersparnis gegenüber wiederholten Chatbot-Anfragen ohne Gedächtnis.',
  },
]

export const PLUS_LIMITS_SUMMARY =
  'Bis zu 10 Fälle · 100 KI-Anfragen/Monat · 500 Seiten Text · optionale Cloud-Sicherung'

export const PLUS_TARIF_LINE_FREE = 'Kostenloser Tarif: ein Fall prüfen, lokal auf dem Gerät.'
export const PLUS_TARIF_LINE_PLUS = `${PLUS_PRODUCT_NAME} · ${PLUS_PRICE_AMOUNT} ${PLUS_PRICE_PERIOD}`
