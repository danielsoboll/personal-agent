import { BRAND_MARK_ALT, BRAND_MARK_SRC } from '@/lib/brand'

export type HomeFlowStep = {
  number: 1 | 2 | 3
  emoji?: string
  label: string
  imageSrc?: string
  imageAlt?: string
  showEmojiInCaption?: boolean
}

export const HOME_FLOW_STEPS: HomeFlowStep[] = [
  {
    number: 1,
    emoji: '📷',
    label: 'Foto machen',
    imageSrc: BRAND_MARK_SRC,
    imageAlt: BRAND_MARK_ALT,
  },
  {
    number: 2,
    emoji: '🤖',
    label: 'KI versteht & bewertet',
  },
  {
    number: 3,
    emoji: '✅',
    label: 'Das solltest du jetzt tun',
    imageSrc: '/home/home-step-understood.png',
    imageAlt: 'Person mit Verstanden-Ausdruck und Idee',
  },
]
