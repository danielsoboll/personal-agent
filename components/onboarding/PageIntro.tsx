import type { ReactNode } from 'react'

import BrandMark from '@/components/brand/BrandMark'

type PageIntroProps = {
  title: string
  description: ReactNode
  /** Header hat bereits BrandMark — auf Startseite weglassen. */
  showBrand?: boolean
}

/** Kopfzeile mit optionalem Behördenpost-Leitbild. */
export default function PageIntro({ title, description, showBrand = true }: PageIntroProps) {
  return (
    <section className="space-y-3">
      {showBrand ? (
        <div className="flex items-start gap-3.5">
          <BrandMark variant="intro" />
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
