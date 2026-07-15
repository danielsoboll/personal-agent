import Image from 'next/image'

import { BRAND_MARK_ALT, BRAND_MARK_SRC } from '@/lib/brand'

export type BrandMarkVariant = 'header' | 'intro' | 'hero' | 'overlay' | 'flowTile'

type BrandMarkProps = {
  variant?: BrandMarkVariant
  className?: string
  priority?: boolean
}

const VARIANTS: Record<
  BrandMarkVariant,
  { size: number; frameClass: string; imageClass: string }
> = {
  header: {
    size: 48,
    frameClass:
      'h-12 w-12 rounded-2xl border border-accent/25 bg-accent-soft/40 shadow-sm ring-1 ring-accent/10',
    imageClass: 'object-cover object-center',
  },
  intro: {
    size: 56,
    frameClass:
      'h-14 w-14 rounded-2xl border border-accent/20 bg-accent-soft/35 shadow-sm ring-1 ring-accent/10',
    imageClass: 'object-cover object-center',
  },
  hero: {
    size: 140,
    frameClass:
      'h-[8.75rem] w-[8.75rem] rounded-2xl border border-accent/20 bg-accent-soft/30 shadow-md ring-1 ring-accent/10',
    imageClass: 'object-cover object-center',
  },
  overlay: {
    size: 80,
    frameClass:
      'h-20 w-20 rounded-2xl border border-border bg-accent-soft/30 shadow-md ring-1 ring-border/30',
    imageClass: 'object-cover object-center',
  },
  flowTile: {
    size: 72,
    frameClass: 'h-full w-full rounded-none border-0 shadow-none ring-0',
    imageClass: 'object-cover object-center',
  },
}

export default function BrandMark({
  variant = 'header',
  className = '',
  priority = false,
}: BrandMarkProps) {
  const config = VARIANTS[variant]

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${config.frameClass} ${className}`}
    >
      <Image
        src={BRAND_MARK_SRC}
        alt={BRAND_MARK_ALT}
        fill
        sizes={`${config.size}px`}
        unoptimized
        priority={priority}
        className={config.imageClass}
      />
    </div>
  )
}
