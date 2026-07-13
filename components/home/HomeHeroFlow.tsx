import Image from 'next/image'

import { IconAiMystery } from '@/components/icons/BehoerdenIcons'
import { HOME_FLOW_STEPS, type HomeFlowStep } from '@/lib/homeFlowSteps'

type HomeHeroFlowProps = {
  className?: string
}

const IMAGE_STEPS = HOME_FLOW_STEPS.filter((step) => step.imageSrc)
const MIDDLE_STEP = HOME_FLOW_STEPS.find((step) => step.number === 2)

const VISUAL_SLOT_CLASS = 'flex h-[8.25rem] w-full items-center justify-center sm:h-[9.75rem]'
const IMAGE_FRAME_CLASS =
  'relative h-[8.25rem] w-[8.25rem] overflow-hidden rounded-2xl border border-accent/15 bg-accent-soft/35 shadow-sm sm:h-[9.75rem] sm:w-[9.75rem]'

function StepCaption({ step, raised = false }: { step: HomeFlowStep; raised?: boolean }) {
  const showEmoji = step.showEmojiInCaption !== false && step.emoji

  return (
    <figcaption
      className={`flex min-h-[3.25rem] w-full flex-col items-center justify-start gap-1 text-center ${
        raised ? '-mt-3 pt-0 sm:-mt-4' : 'pt-2.5'
      }`}
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[0.65rem] font-bold tabular-nums text-accent"
        aria-hidden
      >
        {step.number}
      </span>
      <p className="text-xs font-medium leading-snug text-foreground">
        {showEmoji ? (
          <>
            <span className="mr-0.5" aria-hidden>
              {step.emoji}
            </span>
            {step.label}
          </>
        ) : (
          step.label
        )}
      </p>
    </figcaption>
  )
}

function AiMysteryPanel() {
  return (
    <div className="relative flex items-center justify-center">
      <span
        className="absolute top-1/2 left-0 z-20 -translate-x-[58%] -translate-y-1/2 text-sm text-accent/55 sm:text-base"
        aria-hidden
      >
        →
      </span>

      <div className="relative h-[4.75rem] w-[4.25rem] overflow-hidden rounded-lg border border-accent/35 bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0b1220] shadow-[inset_0_1px_0_rgba(148,163,184,0.12),0_8px_24px_-8px_rgba(15,23,42,0.55)] sm:h-[5.25rem] sm:w-[4.75rem]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(96,165,250,0.22),transparent_62%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(90deg,transparent,transparent_11px,rgba(148,163,184,0.07)_11px,rgba(148,163,184,0.07)_12px)]"
          aria-hidden
        />

        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/25 bg-sky-400/10 shadow-[0_0_16px_rgba(56,189,248,0.22)] sm:h-10 sm:w-10">
            <IconAiMystery size={28} className="text-sky-100/95" />
          </div>
        </div>
      </div>

      <span
        className="absolute top-1/2 right-0 z-20 translate-x-[58%] -translate-y-1/2 text-sm text-accent/55 sm:text-base"
        aria-hidden
      >
        →
      </span>
    </div>
  )
}

/** 3 Schritte von links nach rechts — grosse Bilder, geheimnisvoller KI-Kern in der Mitte. */
export default function HomeHeroFlow({ className = '' }: HomeHeroFlowProps) {
  const [firstStep, lastStep] = IMAGE_STEPS
  const middleStep = MIDDLE_STEP!

  return (
    <section
      className={`rounded-2xl border border-border bg-surface px-3 py-4 shadow-sm sm:px-3.5 sm:py-5 ${className}`}
      aria-labelledby="home-flow-heading"
    >
      <p
        id="home-flow-heading"
        className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-accent sm:mb-4"
      >
        In 3 Schritten
      </p>

      <div className="grid grid-cols-3 gap-x-1 sm:gap-x-1.5">
        <figure className="flex min-w-0 flex-col items-center">
          <div className={VISUAL_SLOT_CLASS}>
            <div className={IMAGE_FRAME_CLASS}>
              <Image
                src={firstStep.imageSrc!}
                alt={firstStep.imageAlt ?? firstStep.label}
                fill
                sizes="(max-width: 640px) 132px, 156px"
                className="object-cover"
                priority
              />
            </div>
          </div>
          <StepCaption step={firstStep} />
        </figure>

        <figure className="flex min-w-0 flex-col items-center overflow-visible">
          <div className={`${VISUAL_SLOT_CLASS} overflow-visible`}>
            <AiMysteryPanel />
          </div>
          <StepCaption step={middleStep} raised />
        </figure>

        <figure className="flex min-w-0 flex-col items-center">
          <div className={VISUAL_SLOT_CLASS}>
            <div className={IMAGE_FRAME_CLASS}>
              <Image
                src={lastStep.imageSrc!}
                alt={lastStep.imageAlt ?? lastStep.label}
                fill
                sizes="(max-width: 640px) 132px, 156px"
                className="object-cover"
                priority
              />
            </div>
          </div>
          <StepCaption step={lastStep} />
        </figure>
      </div>
    </section>
  )
}
