import type { ReactNode } from 'react'

import { IconBrandMark } from '@/components/icons/BehoerdenIcons'

type PageIntroProps = {
  title: string
  description: ReactNode
  /** Header hat bereits Icon — auf Startseite weglassen. */
  showBrand?: boolean
}

/** Kopfzeile mit optionalem Icon. */
export default function PageIntro({ title, description, showBrand = true }: PageIntroProps) {
  return (
    <section className="space-y-3">
      {showBrand ? (
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent-soft/40 text-accent shadow-sm">
            <IconBrandMark size={26} />
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-2xl font-semibold tracking-tight text-balance">{title}</h2>
          </div>
        </div>
      ) : (
        <h2 className="text-2xl font-semibold tracking-tight text-balance">{title}</h2>
      )}
      <p className="leading-7 text-muted">{description}</p>
    </section>
  )
}
