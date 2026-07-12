import Link from 'next/link'

import { LEGAL_PLUS_CHECKOUT_PREFIX } from '@/lib/legalContent'

const linkClass = 'font-medium text-accent underline-offset-4 hover:underline'

type PlusCheckoutLegalNoteProps = {
  className?: string
}

/** Hinweis vor Stripe-Checkout — für künftige PLUS-Einführung. */
export default function PlusCheckoutLegalNote({ className = '' }: PlusCheckoutLegalNoteProps) {
  return (
    <p className={`text-xs leading-6 text-muted ${className}`}>
      {LEGAL_PLUS_CHECKOUT_PREFIX}{' '}
      <Link href="/agb" className={linkClass}>
        AGB
      </Link>{' '}
      und{' '}
      <Link href="/datenschutz" className={linkClass}>
        Datenschutzhinweise
      </Link>
      .
    </p>
  )
}
