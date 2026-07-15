'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import OnboardingShell, {
  FormStickyFooter,
  PageIntro,
  PrimaryButton,
  PrivacyNote,
  formBottomSpacerClass,
} from '@/components/onboarding/OnboardingShell'
import { logUserActivity } from '@/lib/activityLog'
import {
  clearDraftCaseTitle,
  getDraftCaseTitle,
  getDraftFromUrl,
  setDraftCaseTitle,
} from '@/lib/draftCase'
import { createCase } from '@/lib/localCases'
import { getStoredProfileName, setStoredProfileName } from '@/lib/localProfile'
import { recordCaseCreated } from '@/lib/plusEngagement'

function readNameFromForm(form: HTMLFormElement): string {
  const fromFormData = String(new FormData(form).get('name') ?? '').trim()
  if (fromFormData) return fromFormData

  const input = form.elements.namedItem('name')
  if (input instanceof HTMLInputElement) return input.value.trim()

  return ''
}

export default function NameClient() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [caseTitle, setCaseTitle] = useState('')
  const [defaultName, setDefaultName] = useState('')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fromUrl = getDraftFromUrl()
    const draftTitle = fromUrl || getDraftCaseTitle()

    if (!draftTitle) {
      router.replace('/fall/neu')
      return
    }

    setDraftCaseTitle(draftTitle)
    setCaseTitle(draftTitle)

    const storedName = getStoredProfileName()
    if (storedName) {
      void (async () => {
        try {
          setSubmitting(true)
          const created = await createCase(draftTitle, storedName)
          clearDraftCaseTitle()
          recordCaseCreated()
          logUserActivity('case_created', {
            case_id: created.id,
            case_number: created.caseNumber,
            case_title: created.title,
          })
          window.location.assign('/scan')
        } catch (caught) {
          setDefaultName(storedName)
          setError(caught instanceof Error ? caught.message : 'Fall konnte nicht angelegt werden.')
          setSubmitting(false)
          setReady(true)
        }
      })()
      return
    }

    setDefaultName('')
    setReady(true)
  }, [router])

  async function submitNameForm(form: HTMLFormElement) {
    if (submitting) return

    const trimmed = readNameFromForm(form)
    const title = caseTitle.trim()
    if (!trimmed || !title) return

    setError('')
    setSubmitting(true)

    try {
      setStoredProfileName(trimmed)
      const created = await createCase(title, trimmed)
      clearDraftCaseTitle()
      recordCaseCreated()
      logUserActivity('case_created', {
        case_id: created.id,
        case_number: created.caseNumber,
        case_title: created.title,
      })
      window.location.assign('/scan')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Fall konnte nicht angelegt werden.')
      setSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitNameForm(event.currentTarget)
  }

  function handleContinueClick() {
    const form = formRef.current
    if (!form) return
    void submitNameForm(form)
  }

  if (!ready) {
    return (
      <OnboardingShell title="Dein Vorname" subtitle="Behördenpost">
        <p className="text-sm text-muted">Wird geladen …</p>
      </OnboardingShell>
    )
  }

  return (
    <OnboardingShell
      title="Dein Vorname"
      subtitle={caseTitle}
      backNav={{ href: '/fall/neu', label: 'Zurück zum Fallnamen' }}
    >
      <form
        ref={formRef}
        className={`flex flex-1 flex-col gap-8 ${formBottomSpacerClass}`}
        onSubmit={handleSubmit}
      >
        <PageIntro
          title="Wie ist dein Vorname?"
          description={`Fall „${caseTitle}“ — wir nutzen deinen Vornamen nur lokal, damit Erklärungen und Antworten zu deiner Situation passen.`}
        />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-muted">Vorname</span>
          <input
            type="text"
            name="name"
            required
            defaultValue={defaultName}
            autoComplete="given-name"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="z. B. Lukas"
            className="h-14 w-full rounded-2xl border border-border bg-surface px-4 text-base text-foreground outline-none ring-accent focus:ring-2 [font-size:16px]"
          />
        </label>

        <PrivacyNote variant="storage" />

        {error ? (
          <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <FormStickyFooter>
          <PrimaryButton type="button" inactive={submitting} onClick={handleContinueClick}>
            {submitting ? 'Wird angelegt …' : 'Weiter zum Dokument'}
          </PrimaryButton>
        </FormStickyFooter>
      </form>
    </OnboardingShell>
  )
}
