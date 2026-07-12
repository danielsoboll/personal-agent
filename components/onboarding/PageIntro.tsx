import type { ReactNode } from 'react'

import { PageIcon, type PageIconName } from '@/components/icons/BehoerdenIcons'

type PageIntroProps = {
  icon: PageIconName
  title: string
  description: ReactNode
}

/** Dezente Kopfzeile mit Icon für Eingabe- und Formularseiten. */
export default function PageIntro({ icon, title, description }: PageIntroProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent-soft/70 text-accent shadow-sm dark:border-accent/25 dark:bg-accent-soft/40">
          <PageIcon name={icon} size={22} />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">{title}</h2>
        </div>
      </div>
      <p className="leading-7 text-muted">{description}</p>
    </section>
  )
}
