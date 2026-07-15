'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import DeleteAllSection from '@/components/admin/DeleteAllSection'
import OnboardingShell from '@/components/onboarding/OnboardingShell'
import { buttonStyles } from '@/lib/buttonStyles'
import { getStoredProfileName, setStoredProfileName } from '@/lib/localProfile'

export default function AdminClient() {
  const router = useRouter()
  const [profileName, setProfileName] = useState('')
  const [savedName, setSavedName] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const name = getStoredProfileName()
    setProfileName(name)
    setSavedName(name)
  }, [])

  function handleDeleted() {
    router.replace('/')
    router.refresh()
  }

  function handleSaveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = profileName.trim()
    if (!trimmed) {
      setError('Bitte gib einen Vornamen ein.')
      return
    }

    setStoredProfileName(trimmed)
    setSavedName(trimmed)
    setError('')
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <OnboardingShell title="Admin" backNav={{ href: '/', label: 'Zur Startseite' }}>
      <section className="flex flex-1 flex-col gap-8">
        <form onSubmit={handleSaveName} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Vorname</p>
            <p className="text-sm leading-7 text-muted">
              Wird in Erklärungen und KI-Antworten verwendet. Bereits angelegte Fälle behalten ihren
              gespeicherten Namen — neue Fälle nutzen den aktualisierten Vornamen.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-muted">Dein Vorname</span>
            <input
              type="text"
              name="profileName"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              autoComplete="given-name"
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck={false}
              placeholder="z. B. Lukas"
              className="h-14 w-full rounded-2xl border border-border bg-surface px-4 text-base text-foreground outline-none ring-accent focus:ring-2 [font-size:16px]"
            />
          </label>

          <button
            type="submit"
            disabled={!profileName.trim() || profileName.trim() === savedName}
            className={
              !profileName.trim() || profileName.trim() === savedName
                ? buttonStyles.primaryInactive
                : buttonStyles.accentSoft
            }
          >
            Vorname speichern
          </button>

          {saved ? (
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Vorname gespeichert.</p>
          ) : null}
        </form>

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
