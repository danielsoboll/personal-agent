import Image from 'next/image'

import { BRAND_MARK_ALT, BRAND_MARK_SRC } from '@/lib/brand'

export type BrandMarkVariant = 'header' | 'intro' | 'hero' | 'overlay'

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
    size: 44,
    frameClass:
      'h-11 w-11 rounded-2xl border border-accent/20 bg-accent-soft/35 shadow-sm',
    imageClass: 'object-cover object-center',
  },
  intro: {
    size: 44,
    frameClass:
      'h-11 w-11 rounded-2xl border border-accent/15 bg-accent-soft/35 shadow-sm',
    imageClass: 'object-cover object-center',
  },
  hero: {
    size: 156,
    frameClass:
      'h-[9.75rem] w-[9.75rem] rounded-2xl border border-accent/15 bg-accent-soft/35 shadow-sm',
    imageClass: 'object-cover object-center',
  },
  overlay: {
    size: 72,
    frameClass: 'h-[4.5rem] w-[4.5rem] rounded-2xl border border-border shadow-sm',
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
