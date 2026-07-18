'use client'

import { PLUS_CTA_LABEL, PLUS_MOTIVATION_INTRO, PLUS_MOTIVATION_TITLE } from '@/lib/plusFeatures'
import { PLUS_HOME_TEASER_CLASS, PLUS_HOME_TEASER_CTA_CLASS } from '@/lib/plusShell'

type HomePlusTeaserProps = {
  onDiscover: () => void
  className?: string
}

/** Dezenter PLUS-Hinweis auf der Startseite — warm, nicht aufdringlich. */
export default function HomePlusTeaser({ onDiscover, className = '' }: HomePlusTeaserProps) {
  return (
    <section className={`${PLUS_HOME_TEASER_CLASS} ${className}`} aria-label="Behördenpost PLUS">
      <p className="text-sm font-bold leading-snug text-amber-950 dark:text-amber-100">
        {PLUS_MOTIVATION_TITLE}
      </p>
      <p className="mt-1.5 text-xs leading-5 text-amber-900/85 dark:text-amber-200/85">
        {PLUS_MOTIVATION_INTRO}
      </p>
      <button type="button" onClick={onDiscover} className={`mt-3 ${PLUS_HOME_TEASER_CTA_CLASS}`}>
        <span aria-hidden>✨</span>
        {PLUS_CTA_LABEL}
      </button>
    </section>
  )
}
