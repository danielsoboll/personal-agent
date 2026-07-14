'use client'

import { PLUS_ACTIVE_HEADER_HINT, PLUS_ACTIVE_HEADER_LABEL } from '@/lib/plusFeatures'
import { PLUS_ACTIVE_BADGE_CLASS } from '@/lib/plusShell'

type PlusActiveHeaderButtonProps = {
  label?: string
  hint?: string
  onClick?: () => void
}

function PlusActiveCheckIcon() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="10" cy="10" r="8.5" className="fill-emerald-500/15 dark:fill-emerald-400/20" />
      <circle
        cx="10"
        cy="10"
        r="8.5"
        className="stroke-emerald-600 dark:stroke-emerald-400"
        strokeWidth="1.5"
      />
      <path
        d="M6.25 10.25 8.75 12.75 13.75 7.75"
        className="stroke-emerald-700 dark:stroke-emerald-300"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** PLUS aktiv — sichtbare Bestätigung im Header (tipbar → PLUS-Übersicht). */
export default function PlusActiveHeaderButton({
  label = PLUS_ACTIVE_HEADER_LABEL,
  hint = PLUS_ACTIVE_HEADER_HINT,
  onClick,
}: PlusActiveHeaderButtonProps) {
  const content = (
    <>
      <PlusActiveCheckIcon />
      <span className="leading-none">{label}</span>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={PLUS_ACTIVE_BADGE_CLASS}
        aria-label={hint}
        title={hint}
      >
        {content}
      </button>
    )
  }

  return (
    <div className={PLUS_ACTIVE_BADGE_CLASS} aria-label={hint} title={hint}>
      {content}
    </div>
  )
}
