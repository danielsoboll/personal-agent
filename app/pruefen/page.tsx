import { Suspense } from 'react'

import OnboardingShell from '@/components/onboarding/OnboardingShell'

import ReviewClient from './ReviewClient'

function ReviewFallback() {
  return (
    <OnboardingShell title="Auswertung" subtitle="Behördenpost">
      <p className="text-sm text-muted">Auswertung wird geladen …</p>
    </OnboardingShell>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<ReviewFallback />}>
      <ReviewClient />
    </Suspense>
  )
}
