'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import DeleteAllSection from '@/components/admin/DeleteAllSection'
import OnboardingShell from '@/components/onboarding/OnboardingShell'
import { getStoredProfileName } from '@/lib/localProfile'

export default function AdminClient() {
  const router = useRouter()
  const [profileName, setProfileName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setProfileName(getStoredProfileName())
  }, [])

  function handleDeleted() {
    router.replace('/')
    router.refresh()
  }

  return (
    <OnboardingShell title="Admin" backNav={{ href: '/', label: 'Zur Startseite' }}>
      <section className="flex flex-1 flex-col gap-8">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Vorname</p>
          <p className="text-3xl font-semibold tracking-tight">{profileName || 'Nutzer'}</p>
          {!profileName ? (
            <p className="text-sm text-muted">Noch kein Vorname gespeichert — es wird „Nutzer“ verwendet.</p>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
            {error}
          </p>
        ) : null}

        <DeleteAllSection onDeleted={handleDeleted} onError={setError} />
      </section>
    </OnboardingShell>
  )
}
