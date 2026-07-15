import { Suspense } from 'react'

import OnboardingShell from '@/components/onboarding/OnboardingShell'

import NameClient from './NameClient'

function NameFallback() {
  return (
    <OnboardingShell title="Dein Vorname" subtitle="Behördenpost">
      <p className="text-sm text-muted">Wird geladen …</p>
    </OnboardingShell>
  )
}

export default function NamePage() {
  return (
    <Suspense fallback={<NameFallback />}>
      <NameClient />
    </Suspense>
  )
}
