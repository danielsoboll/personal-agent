'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

import OnboardingShell, { PrimaryButton, PrivacyNote } from '@/components/onboarding/OnboardingShell'
import { setDraftCaseTitle } from '@/lib/draftCase'

export default function NewCasePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    setDraftCaseTitle(trimmed)
    router.push('/name')
  }

  return (
    <OnboardingShell
      title="Neuer Fall"
      subtitle="Behördenpost"
      footer={
        <PrimaryButton type="submit" form="new-case-form" disabled={!title.trim()}>
          Weiter
        </PrimaryButton>
      }
    >
      <form id="new-case-form" className="flex flex-1 flex-col gap-8" onSubmit={handleSubmit}>
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Wie soll der Fall heißen?</h2>
          <p className="leading-7 text-muted">
            Gib deinem Fall einen Namen, damit du ihn später wiederfindest — zum Beispiel nach dem
            Thema oder Absender.
          </p>
        </section>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-muted">Fallname</span>
          <input
            type="text"
            name="title"
            autoComplete="off"
            enterKeyHint="next"
            placeholder="z. B. Unterhalt Neuberechnung"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-14 w-full rounded-2xl border border-border bg-surface px-4 text-base outline-none ring-accent focus:ring-2"
          />
        </label>

        <PrivacyNote variant="storage" />
      </form>
    </OnboardingShell>
  )
}
