import { Suspense } from 'react'

import OnboardingShell from '@/components/onboarding/OnboardingShell'
import PlusSuccessClient from '@/app/plus/success/PlusSuccessClient'

export default function PlusSuccessPage() {
  return (
    <OnboardingShell title="PLUS" backNav={{ href: '/', label: 'Zur Startseite' }}>
      <Suspense
        fallback={
          <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Zahlung wird geprüft …</h2>
            <p className="text-sm leading-7 text-muted">Einen Moment …</p>
          </section>
        }
      >
        <PlusSuccessClient />
      </Suspense>
    </OnboardingShell>
  )
}
