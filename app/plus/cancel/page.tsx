import Link from 'next/link'

import OnboardingShell from '@/components/onboarding/OnboardingShell'
import { buttonStyles } from '@/lib/buttonStyles'

export default function PlusCancelPage() {
  return (
    <OnboardingShell title="PLUS" backNav={{ href: '/', label: 'Zur Startseite' }}>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Checkout abgebrochen</h2>
        <p className="text-sm leading-7 text-muted">
          Es wurde kein Abo abgeschlossen. Du kannst PLUS jederzeit erneut über den Button auf der Startseite
          entdecken.
        </p>
        <Link href="/" className={buttonStyles.secondary}>
          Zur Startseite
        </Link>
      </section>
    </OnboardingShell>
  )
}
