import Link from 'next/link'

const linkClass =
  'text-xs leading-none text-muted underline-offset-2 transition-colors hover:text-accent hover:underline'

const separatorClass = 'text-xs text-border'

type LegalFooterNavProps = {
  className?: string
}

export default function LegalFooterNav({ className = '' }: LegalFooterNavProps) {
  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center ${className}`}
      aria-label="Rechtliches"
    >
      <Link href="/impressum" className={linkClass}>
        Impressum
      </Link>
      <span className={separatorClass} aria-hidden>
        |
      </span>
      <Link href="/datenschutz" className={linkClass}>
        Datenschutz
      </Link>
      <span className={separatorClass} aria-hidden>
        |
      </span>
      <Link href="/haftung" className={linkClass}>
        Haftung
      </Link>
      <span className={separatorClass} aria-hidden>
        |
      </span>
      <Link href="/agb" className={linkClass}>
        AGB
      </Link>
    </nav>
  )
}
