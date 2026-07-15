import { Suspense } from 'react'

import OnboardingShell, { PrimaryButton } from '@/components/onboarding/OnboardingShell'

import ScanClient from './ScanClient'

function ScanFallback() {
  return (
    <OnboardingShell
      title="Dokument erfassen"
      subtitle="Behördenpost"
      footer={<PrimaryButton inactive>Prüfen</PrimaryButton>}
    >
      <p className="text-sm text-muted">Wird geladen …</p>
    </OnboardingShell>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={<ScanFallback />}>
      <ScanClient />
    </Suspense>
  )
}
