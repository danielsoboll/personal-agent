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
    imageSrc: '/home/home-step-scan.png',
    imageAlt: 'Dokument fotografieren bzw. scannen',
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
