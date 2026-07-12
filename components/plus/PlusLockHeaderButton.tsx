'use client'

import type { ReactNode } from 'react'

import { PLUS_CTA_BUTTON_CLASS, PLUS_LOCK_BUTTON_BASE } from '@/lib/plusShell'
import { PLUS_CTA_LABEL, PLUS_DISCOVER_LABEL } from '@/lib/plusFeatures'

export type PlusLockHeaderButtonVariant = 'header' | 'cta'

type PlusLockHeaderButtonProps = {
  onClick: () => void
  label?: string
  children?: ReactNode
  variant?: PlusLockHeaderButtonVariant
  showLock?: boolean
  disabled?: boolean
}

const VARIANT_CLASS: Record<PlusLockHeaderButtonVariant, string> = {
  header: `${PLUS_LOCK_BUTTON_BASE} flex h-12 shrink-0 items-center gap-1.5 rounded-2xl px-3 text-sm`,
  cta: `${PLUS_CTA_BUTTON_CLASS} flex items-center justify-center gap-2 disabled:opacity-60`,
}

export default function PlusLockHeaderButton({
  onClick,
  label = PLUS_DISCOVER_LABEL,
  children,
  variant = 'header',
  showLock = true,
  disabled,
}: PlusLockHeaderButtonProps) {
  const isHeader = variant === 'header'
  const visibleLabel = children ?? (variant === 'cta' ? PLUS_CTA_LABEL : 'PLUS')

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={VARIANT_CLASS[variant]}
      aria-label={label}
      title={label}
    >
      {showLock ? (
        <span className="text-base leading-none" aria-hidden>
          🔒
        </span>
      ) : null}
      <span className={isHeader ? 'hidden min-[380px]:inline' : undefined}>{visibleLabel}</span>
    </button>
  )
}

export const PLUS_SECONDARY_BUTTON_CLASS =
  'app-btn lifexp-pressable-3d w-full rounded-xl border-2 border-border bg-gradient-to-b from-surface via-slate-50 to-slate-200/90 px-4 py-3 text-sm font-bold text-foreground dark:border-slate-600 dark:from-slate-800 dark:via-slate-800 dark:to-slate-950'
