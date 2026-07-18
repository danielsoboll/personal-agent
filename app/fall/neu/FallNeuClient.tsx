'use client'

import { FormEvent, useRef, useState } from 'react'

import AutofillSafeTextInput from '@/components/AutofillSafeTextInput'
import IosContactAutofillDecoy from '@/components/IosContactAutofillDecoy'
import OnboardingShell, {
  FormStickyFooter,
  PageIntro,
  PrimaryButton,
  formBottomSpacerClass,
} from '@/components/onboarding/OnboardingShell'
import { logUserActivity } from '@/lib/activityLog'
import { clearDraftCaseTitle, setDraftCaseTitle } from '@/lib/draftCase'
import { CASE_TITLE_FIELD_NAME, caseTitleInputProps } from '@/lib/formInputAutofill'
import { createCase } from '@/lib/localCases'
import { getStoredProfileName } from '@/lib/localProfile'
import { recordCaseCreated } from '@/lib/plusEngagement'

function readTitleFromForm(form: HTMLFormElement): string {
  const fromFormData = String(new FormData(form).get(CASE_TITLE_FIELD_NAME) ?? '').trim()
  if (fromFormData) return fromFormData

  const input = form.elements.namedItem(CASE_TITLE_FIELD_NAME)
  if (input instanceof HTMLInputElement) return input.value.trim()

  return ''
}

export default function FallNeuClient() {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submitForm(form: HTMLFormElement) {
    if (submitting) return

    const title = readTitleFromForm(form)
    if (!title) return

    setError('')
    setSubmitting(true)

    try {
      const profileName = getStoredProfileName()
      if (profileName) {
        const created = await createCase(title, profileName)
        clearDraftCaseTitle()
        recordCaseCreated()
        logUserActivity('case_created', {
          case_id: created.id,
          case_number: created.caseNumber,
          case_title: created.title,
        })
        window.location.assign('/scan')
        return
      }

      setDraftCaseTitle(title)
      window.location.assign('/name')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Fall konnte nicht angelegt werden.')
      setSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitForm(event.currentTarget)
  }

  function handleContinueClick() {
    const form = formRef.current
    if (!form) return
    void submitForm(form)
  }

  return (
    <OnboardingShell
      title="Neuer Fall"
      subtitle="Behördenpost"
      backNav={{ href: '/', label: 'Zurück zur Fallübersicht' }}
    >
      <form
        ref={formRef}
        className={`flex flex-1 flex-col gap-8 ${formBottomSpacerClass}`}
        onSubmit={handleSubmit}
      >
        <PageIntro title="Wie soll der Fall heißen?" description="Kurz und klar — zum Wiederfinden." />

        <label className="relative block space-y-2">
          <IosContactAutofillDecoy />
          <span className="text-sm font-medium text-muted">Fallname</span>
          <AutofillSafeTextInput
            id="behoerdenpost-case-title"
            required
            enterKeyHint="go"
            placeholder="z. B. Unterhalt"
            className="h-14 w-full rounded-2xl border border-border bg-surface px-4 text-base text-foreground outline-none ring-accent focus:ring-2"
            autofillProps={caseTitleInputProps()}
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <FormStickyFooter>
          <PrimaryButton type="button" inactive={submitting} onClick={handleContinueClick}>
            {submitting ? 'Wird angelegt …' : 'Weiter'}
          </PrimaryButton>
        </FormStickyFooter>
      </form>
    </OnboardingShell>
  )
}
