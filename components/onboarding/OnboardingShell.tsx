'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

import ThemeToggle from '@/components/ThemeToggle'
import { buttonStyles } from '@/lib/buttonStyles'
import { PRIVACY_ANALYSIS_SHORT, PRIVACY_STORAGE_SHORT } from '@/lib/privacyCopy'

type OnboardingShellProps = {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  headerAction?: ReactNode
  /** Einheitliche Zurück-Navigation oben im Inhalt */
  backNav?: {
    href: string
    label: string
  }
}

export function BackNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-mt-2 mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent"
    >
      <span aria-hidden className="text-base leading-none">
        ←
      </span>
      {label}
    </Link>
  )
}

export { default as PageIntro } from '@/components/onboarding/PageIntro'
export default function OnboardingShell({
  title,
  subtitle,
  children,
  footer,
  headerAction,
  backNav,
}: OnboardingShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface px-5 py-4">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-accent/20 shadow-sm">
            <Image
              src="/icon-192.png"
              alt=""
              width={44}
              height={44}
              unoptimized
              className="h-full w-full object-cover"
              priority
            />
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

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-8">
        {backNav ? <BackNavLink href={backNav.href} label={backNav.label} /> : null}
        {children}
      </main>

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
  const className = inactive ? buttonStyles.primaryInactive : buttonStyles.primaryActive

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
  const text = variant === 'analysis' ? PRIVACY_ANALYSIS_SHORT : PRIVACY_STORAGE_SHORT

  return (
    <p className="rounded-2xl border border-accent/20 bg-accent-soft px-4 py-3 text-sm leading-6 text-foreground">
      {text}{' '}
      <Link href="/datenschutz" className="font-medium text-accent underline-offset-4 hover:underline">
        Datenschutzerklärung
      </Link>
    </p>
  )
}

export const formBottomSpacerClass = 'pb-28'
