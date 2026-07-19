import { Suspense } from 'react'

import OnboardingShell from '@/components/onboarding/OnboardingShell'

import VorgeschichteClient from './VorgeschichteClient'

function Fallback() {
  return (
    <OnboardingShell title="Vorgeschichte" subtitle="Behördenpost">
      <p className="text-sm text-muted">Wird geladen …</p>
    </OnboardingShell>
  )
}

export default function VorgeschichtePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <VorgeschichteClient />
    </Suspense>
  )
}
