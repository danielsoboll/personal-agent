'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import OnboardingShell, { PrimaryButton, PrivacyNote } from '@/components/onboarding/OnboardingShell'
import { clearDraftCaseTitle, getDraftCaseTitle } from '@/lib/draftCase'
import { createCase } from '@/lib/localCases'
import { getStoredProfileName, setStoredProfileName } from '@/lib/localProfile'

export default function NamePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [caseTitle, setCaseTitle] = useState('')
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const draftTitle = getDraftCaseTitle()
    if (!draftTitle) {
      router.replace('/fall/neu')
      return
    }

    setCaseTitle(draftTitle)
    setName(getStoredProfileName())
    setMounted(true)
  }, [router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    const title = caseTitle.trim()
    if (!trimmed || !title || submitting) return

    setError('')
    setSubmitting(true)

    try {
      setStoredProfileName(trimmed)
      await createCase(title, trimmed)
      clearDraftCaseTitle()
      router.push('/scan')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Fall konnte nicht angelegt werden.')
      setSubmitting(false)
    }
  }

  return (
    <OnboardingShell
      title="Dein Name"
      subtitle={caseTitle || 'Behördenpost'}
      footer={
        <PrimaryButton
          type="submit"
          form="profile-name-form"
          disabled={!mounted || !name.trim() || submitting}
        >
          Weiter
        </PrimaryButton>
      }
    >
      <form id="profile-name-form" className="flex flex-1 flex-col gap-8" onSubmit={(event) => void handleSubmit(event)}>
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Bitte gib deinen Namen ein</h2>
          <p className="leading-7 text-muted">
            Fall „{caseTitle || '…'}“ — wir nutzen deinen Namen nur lokal, damit Erklärungen und
            Antworten zu deiner Situation passen.
          </p>
        </section>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-muted">Vor- und Nachname</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            enterKeyHint="next"
            placeholder="z. B. Maria Schmidt"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-14 w-full rounded-2xl border border-border bg-surface px-4 text-base outline-none ring-accent focus:ring-2"
          />
        </label>

        <PrivacyNote variant="storage" />

        {error ? (
          <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}
      </form>
    </OnboardingShell>
  )
}
