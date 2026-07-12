'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

import ThemeToggle from '@/components/ThemeToggle'

type OnboardingShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  headerAction?: ReactNode
}

export default function OnboardingShell({
  title,
  subtitle,
  children,
  footer,
  headerAction,
}: OnboardingShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface px-5 py-4">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-white">
            B
          </div>
          <div className="min-w-0 flex-1">
            {subtitle ? (
              <p className="truncate text-sm font-medium text-muted">{subtitle}</p>
            ) : null}
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
          </div>
          {headerAction}
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-8">{children}</main>

      {footer ? (
        <footer className="sticky bottom-0 border-t border-border bg-surface/95 px-5 py-4 backdrop-blur">
          <div className="mx-auto w-full max-w-lg">{footer}</div>
        </footer>
      ) : null}
    </div>
  )
}

/** Fixierter Formular-Fuß — Button liegt im <form>, funktioniert zuverlässig auf iOS. */
export function FormStickyFooter({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
      <div className="mx-auto w-full max-w-lg">{children}</div>
    </div>
  )
}

type PrimaryButtonProps = {
  children: ReactNode
  /** Nur Optik — kein natives disabled (iOS-Safari hakt da oft). */
  inactive?: boolean
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
}

export function PrimaryButton({
  children,
  inactive,
  href,
  onClick,
  type = 'button',
}: PrimaryButtonProps) {
  const className = inactive
    ? 'lifexp-flat-button flex h-14 w-full cursor-not-allowed items-center justify-center rounded-2xl bg-border text-base font-semibold text-muted opacity-70'
    : 'lifexp-flat-button flex h-14 w-full items-center justify-center rounded-2xl bg-accent text-base font-semibold text-white transition-transform active:scale-[0.99]'

  if (href && !inactive) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      className={className}
      aria-disabled={inactive || undefined}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function PrivacyNote({ variant = 'storage' }: { variant?: 'storage' | 'analysis' }) {
  const text =
    variant === 'analysis'
      ? 'Fotos werden zur Auswertung an die KI gesendet. Dein persönlicher Hintergrund bleibt nur auf deinem Handy — verarbeitete Fotos werden danach lokal gelöscht.'
      : 'Dein persönlicher Hintergrund bleibt nur auf deinem Handy gespeichert. Verarbeitete Fotos werden nach jeder Prüfung gelöscht.'

  return (
    <p className="rounded-2xl border border-accent/20 bg-accent-soft px-4 py-3 text-sm leading-6 text-foreground">
      {text}
    </p>
  )
}

export const formBottomSpacerClass = 'pb-28'
