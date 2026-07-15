import type { ReactNode } from 'react'

type PageIntroProps = {
  title: string
  description: ReactNode
}

export default function PageIntro({ title, description }: PageIntroProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold tracking-tight text-balance">{title}</h2>
      <p className="leading-7 text-muted">{description}</p>
    </section>
  )
}
