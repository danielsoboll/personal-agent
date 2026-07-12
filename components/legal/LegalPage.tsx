'use client'

import Link from 'next/link'
import { Fragment } from 'react'

import LegalFooterNav from '@/components/legal/LegalFooterNav'
import ThemeToggle from '@/components/ThemeToggle'
import { BackNavLink } from '@/components/onboarding/OnboardingShell'
import type { LegalSection } from '@/lib/legalContent'

type LegalPageProps = {
  title: string
  sections: LegalSection[]
}

const LEGAL_LINK_CLASS =
  'font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent'

function renderLegalParagraph(paragraph: string) {
  const emailMatch = paragraph.match(/^(E-Mail:\s*)([^\s]+@[^\s]+)$/)
  if (emailMatch) {
    const [, prefix, email] = emailMatch
    return (
      <p>
        {prefix}
        <a href={`mailto:${email}`} className={LEGAL_LINK_CLASS}>
          {email}
        </a>
      </p>
    )
  }

  const urlMatch = paragraph.match(/(https:\/\/[^\s]+)/)
  if (urlMatch) {
    const [url] = urlMatch
    const parts = paragraph.split(url)
    return (
      <p>
        {parts[0]}
        <a href={url} className={LEGAL_LINK_CLASS} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
        {parts[1]}
      </p>
    )
  }

  return <p>{paragraph}</p>
}

export default function LegalPage({ title, sections }: LegalPageProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-8">
        <div className="mb-2 flex items-start justify-between gap-3">
          <BackNavLink href="/" label="Zurück zur Fallübersicht" />
          <ThemeToggle />
        </div>

        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </header>

        <article className="space-y-6 rounded-2xl border border-border bg-surface p-5">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-base font-semibold">{section.title}</h2>
              <div className="space-y-3 text-sm leading-relaxed text-muted">
                {section.paragraphs.map((paragraph) => (
                  <Fragment key={paragraph}>{renderLegalParagraph(paragraph)}</Fragment>
                ))}
                {section.listItems ? (
                  <ul className="list-disc space-y-1.5 pl-5 text-foreground">
                    {section.listItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}
        </article>

        <LegalFooterNav className="mt-8" />
      </main>
    </div>
  )
}
