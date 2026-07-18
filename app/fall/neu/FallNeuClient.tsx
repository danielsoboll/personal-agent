'use client'

import { FormEvent, useRef, useState } from 'react'

import AutofillSafeTextInput from '@/components/AutofillSafeTextInput'
import IosContactAutofillDecoy from '@/components/IosContactAutofillDecoy'
import { IconBrandMark } from '@/components/icons/BehoerdenIcons'
import OnboardingShell, {
  FormStickyFooter,
  PrimaryButton,
  PrivacyNote,
  formBottomSpacerClass,
} from '@/components/onboarding/OnboardingShell'
import { logUserActivity } from '@/lib/activityLog'
import { clearDraftCaseTitle, setDraftCaseTitle } from '@/lib/draftCase'
import { CASE_TITLE_FIELD_NAME, caseTitleInputProps } from '@/lib/formInputAutofill'
import { isAtFreeCaseLimit } from '@/lib/freeCaseLimit'
import { createCase, listCases } from '@/lib/localCases'
import { getStoredProfileName } from '@/lib/localProfile'
import { recordCaseCreated, unlockPlusDiscoverNow } from '@/lib/plusEngagement'

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
      const existing = await listCases()
      if (isAtFreeCaseLimit(existing.length)) {
        unlockPlusDiscoverNow()
        setError(
          'Kostenlos kannst du einen Fall gleichzeitig nutzen. Lösche den bisherigen Fall auf der Startseite — oder hol dir PLUS.',
        )
        setSubmitting(false)
        return
      }

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
        className={`flex flex-1 flex-col gap-6 ${formBottomSpacerClass}`}
        onSubmit={handleSubmit}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent-soft text-accent">
              <IconBrandMark size={28} />
            </span>
            <h2 className="min-w-0 flex-1 pt-0.5 text-2xl font-semibold tracking-tight text-balance">
              Wie soll der Fall heißen?
            </h2>
          </div>
          <p className="leading-7 text-muted">
            Kurz und klar — zum Wiederfinden, z. B. nach Thema oder Absender.
          </p>
        </div>

        <label className="relative block space-y-6">
          <IosContactAutofillDecoy />
          <span className="text-base font-semibold text-foreground">Fallname</span>
          <AutofillSafeTextInput
            id="behoerdenpost-case-title"
            required
            autoFocus
            enterKeyHint="go"
            placeholder="z. B. Unterhalt Neuberechnung"
            className="h-14 w-full rounded-2xl border border-border bg-surface px-4 text-base text-foreground outline-none ring-accent focus:ring-2 [font-size:16px]"
            autofillProps={caseTitleInputProps()}
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
            {submitting ? 'Wird angelegt …' : 'Weiter'}
          </PrimaryButton>
        </FormStickyFooter>
      </form>
    </OnboardingShell>
  )
}
