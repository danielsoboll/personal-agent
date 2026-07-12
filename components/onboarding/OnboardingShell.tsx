import Link from 'next/link'
import type { ReactNode } from 'react'

import ThemeToggle from '@/components/ThemeToggle'

type OnboardingShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
  footer: ReactNode
}

export default function OnboardingShell({
  title,
  subtitle,
  children,
  footer,
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
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-8">{children}</main>

      <footer className="sticky bottom-0 border-t border-border bg-surface/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-lg">{footer}</div>
      </footer>
    </div>
  )
}

type PrimaryButtonProps = {
  children: ReactNode
  disabled?: boolean
  href?: string
  form?: string
  onClick?: () => void
  type?: 'button' | 'submit'
}

export function PrimaryButton({
  children,
  disabled,
  href,
  form,
  onClick,
  type = 'button',
}: PrimaryButtonProps) {
  const className =
    'flex h-14 w-full items-center justify-center rounded-2xl bg-accent text-base font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45'

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} form={form} className={className} disabled={disabled} onClick={onClick}>
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
