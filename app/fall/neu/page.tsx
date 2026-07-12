import OnboardingShell, {
  FormStickyFooter,
  PrimaryButton,
  PrivacyNote,
  formBottomSpacerClass,
} from '@/components/onboarding/OnboardingShell'

import { continueWithCaseTitle } from './actions'

export default function NewCasePage() {
  return (
    <OnboardingShell title="Neuer Fall" subtitle="Behördenpost">
      <form
        action={continueWithCaseTitle}
        className={`flex flex-1 flex-col gap-8 ${formBottomSpacerClass}`}
      >
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
            required
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="z. B. Unterhalt Neuberechnung"
            className="h-14 w-full rounded-2xl border border-border bg-surface px-4 text-base text-foreground outline-none ring-accent focus:ring-2 [font-size:16px]"
          />
        </label>

        <PrivacyNote variant="storage" />

        <FormStickyFooter>
          <PrimaryButton type="submit">Weiter</PrimaryButton>
        </FormStickyFooter>
      </form>
    </OnboardingShell>
  )
}
