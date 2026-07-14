import Image from 'next/image'

import { BRAND_MARK_ALT, BRAND_MARK_SRC } from '@/lib/brand'

export type BrandMarkVariant = 'header' | 'intro' | 'hero' | 'overlay' | 'watermark'

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
    frameClass: 'h-11 w-11 overflow-hidden rounded-2xl border border-accent/20 shadow-sm',
    imageClass: 'object-cover',
  },
  intro: {
    size: 44,
    frameClass:
      'h-11 w-11 overflow-hidden rounded-2xl border border-accent/15 bg-accent-soft/35 shadow-sm',
    imageClass: 'object-cover',
  },
  hero: {
    size: 156,
    frameClass:
      'h-[9.75rem] w-[9.75rem] overflow-hidden rounded-2xl border border-accent/15 bg-accent-soft/35 shadow-sm sm:h-[9.75rem] sm:w-[9.75rem]',
    imageClass: 'object-cover',
  },
  overlay: {
    size: 72,
    frameClass: 'h-[4.5rem] w-[4.5rem] overflow-hidden rounded-2xl border border-border shadow-sm',
    imageClass: 'object-cover',
  },
  watermark: {
    size: 320,
    frameClass: 'pointer-events-none absolute -right-8 bottom-8 h-56 w-56 opacity-[0.05] dark:opacity-[0.08]',
    imageClass: 'object-contain',
  },
}

export default function BrandMark({
  variant = 'header',
  className = '',
  priority = false,
}: BrandMarkProps) {
  const config = VARIANTS[variant]

  return (
    <div className={`relative shrink-0 ${config.frameClass} ${className}`} aria-hidden={variant === 'watermark'}>
      <Image
        src={BRAND_MARK_SRC}
        alt={variant === 'watermark' ? '' : BRAND_MARK_ALT}
        width={config.size}
        height={config.size}
        unoptimized
        priority={priority}
        className={`h-full w-full ${config.imageClass}`}
      />
    </div>
  )
}
