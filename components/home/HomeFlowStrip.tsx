import BrandMark from '@/components/brand/BrandMark'
import { IconAiMystery } from '@/components/icons/BehoerdenIcons'
import { HOME_FLOW_STEPS } from '@/lib/homeFlowSteps'

type HomeFlowStripProps = {
  className?: string
}

function StepBubble({ step }: { step: (typeof HOME_FLOW_STEPS)[number] }) {
  const isAiStep = step.number === 2
  const isPhotoStep = step.number === 1

  return (
    <li className="flex min-w-0 flex-col items-center text-center">
      <div
        className={`flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-2xl border-2 shadow-sm ${
          isAiStep
            ? 'border-sky-300/70 bg-gradient-to-br from-sky-50 via-blue-50/90 to-accent-soft/60 ring-1 ring-sky-200/40 dark:border-sky-700/50 dark:from-sky-950/40 dark:via-blue-950/30 dark:to-accent-soft/20'
            : 'border-amber-200/80 bg-gradient-to-br from-amber-50/95 via-orange-50/70 to-surface ring-1 ring-amber-200/35 dark:border-amber-800/45 dark:from-amber-950/35 dark:via-orange-950/20 dark:to-slate-900'
        }`}
      >
        {isPhotoStep ? (
          <BrandMark variant="flowTile" />
        ) : isAiStep ? (
          <IconAiMystery size={34} className="text-accent dark:text-sky-300" />
        ) : (
          <span className="text-3xl leading-none" aria-hidden>
            {step.emoji}
          </span>
        )}
      </div>
      <span
        className="mt-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-[0.65rem] font-bold tabular-nums text-accent"
        aria-hidden
      >
        {step.number}
      </span>
      <p className="mt-1 max-w-[6.5rem] text-[0.7rem] font-semibold leading-snug text-foreground">
        {step.label}
      </p>
    </li>
  )
}

/** Kompakter 3-Schritte-Flow — feste Kachelgrößen, kein Vollbild. */
export default function HomeFlowStrip({ className = '' }: HomeFlowStripProps) {
  return (
    <section
      className={`rounded-2xl border border-border/80 bg-gradient-to-b from-surface via-accent-soft/15 to-surface px-3 py-4 ring-1 ring-border/20 dark:via-accent-soft/5 ${className}`}
      aria-labelledby="home-flow-heading"
    >
      <p
        id="home-flow-heading"
        className="mb-3.5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-accent"
      >
        In 3 Schritten
      </p>

      <ol className="grid grid-cols-3 items-start gap-1 sm:gap-2">
        {HOME_FLOW_STEPS.map((step) => (
          <StepBubble key={step.number} step={step} />
        ))}
      </ol>
    </section>
  )
}
