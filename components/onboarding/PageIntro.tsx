import type { ReactNode } from 'react'

import { IconBrandMark } from '@/components/icons/BehoerdenIcons'

type PageIntroProps = {
  title: string
  description: ReactNode
  /** Startseite: Header hat schon Logo — hier weglassen. */
  showBrand?: boolean
  /** Größere Überschrift (z. B. Fallname / Vorname). */
  large?: boolean
}

export default function PageIntro({
  title,
  description,
  showBrand = true,
  large = false,
}: PageIntroProps) {
  const titleClass = large
    ? 'text-[1.75rem] font-bold tracking-tight text-balance leading-snug sm:text-3xl'
    : 'text-2xl font-semibold tracking-tight text-balance'

  return (
    <section className="space-y-3">
      {showBrand ? (
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent-soft text-accent">
            <IconBrandMark size={28} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className={titleClass}>{title}</h2>
          </div>
        </div>
      ) : (
        <h2 className={titleClass}>{title}</h2>
      )}
      <p className={`text-muted ${large ? 'text-base leading-7' : 'leading-7'}`}>{description}</p>
    </section>
  )
}
