import type { ReactNode } from 'react'

import BrandMark from '@/components/brand/BrandMark'

type PageIntroProps = {
  title: string
  description: ReactNode
}

/** Kopfzeile mit Behördenpost-Leitbild (Brief + Handy). */
export default function PageIntro({ title, description }: PageIntroProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3.5">
        <BrandMark variant="intro" />
        <div className="min-w-0 pt-0.5">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">{title}</h2>
        </div>
      </div>
      <p className="leading-7 text-muted">{description}</p>
    </section>
  )
}
