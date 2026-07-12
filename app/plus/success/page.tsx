import Link from 'next/link'

import OnboardingShell from '@/components/onboarding/OnboardingShell'
import { buttonStyles } from '@/lib/buttonStyles'

export default function PlusSuccessPage() {
  return (
    <OnboardingShell title="PLUS" backNav={{ href: '/', label: 'Zur Startseite' }}>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Danke — Zahlung wird geprüft</h2>
        <p className="text-sm leading-7 text-muted">
          Sobald Stripe angebunden ist, wird PLUS hier automatisch freigeschaltet. Bis dahin kannst du Behördenpost
          wie gewohnt nutzen.
        </p>
        <Link href="/" className={buttonStyles.secondary}>
          Zur Startseite
        </Link>
      </section>
    </OnboardingShell>
  )
}
