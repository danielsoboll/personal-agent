'use client'

import Image from 'next/image'
import { useEffect, useState, type ReactNode } from 'react'

import { buttonStyles } from '@/lib/buttonStyles'
import { APP_NAME, getAppIconPath } from '@/lib/appIcon'
import {
  canShowNativeInstallPrompt,
  getPwaInstallPlatform,
  isIosDevice,
  isStandaloneDisplayMode,
  PWA_INSTALL_PROMPT_READY_EVENT,
  requestPwaInstall,
  type PwaInstallResult,
} from '@/lib/pwaInstall'

type PwaInstallPanelProps = {
  showLaterButton?: boolean
  onLater?: () => void
  onInstalled?: () => void
  showIosDoneButton?: boolean
  iosInstallConfirmed?: boolean
  onIosDone?: () => void
  iosDoneSaving?: boolean
  prominent?: boolean
}

const IOS_STEP_ICON_CLASS =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90 text-accent shadow-sm ring-1 ring-accent/25 dark:bg-slate-900/70 dark:text-accent dark:ring-accent/40'

function IosSafariMoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
      <circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.25" cy="12" r="1.15" />
      <circle cx="12" cy="12" r="1.15" />
      <circle cx="15.75" cy="12" r="1.15" />
    </svg>
  )
}

function IosSafariShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4.5v8.25" />
      <path d="M8.25 8.25 12 4.5l3.75 3.75" />
      <rect x="5.25" y="10.5" width="13.5" height="9" rx="1.75" />
    </svg>
  )
}

function IosSafariAddToHomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
    >
      <rect x="5.25" y="5.25" width="13.5" height="13.5" rx="2" />
      <path d="M12 8.25v7.5" />
      <path d="M8.25 12h7.5" />
    </svg>
  )
}

function IosInstallStep({ text, icon }: { text: string; icon?: ReactNode }) {
  return (
    <li>
      <span className="flex items-center justify-between gap-3">
        <span>{text}</span>
        {icon ? <span className={IOS_STEP_ICON_CLASS}>{icon}</span> : null}
      </span>
    </li>
  )
}

function IphoneInstallSteps() {
  return (
    <ol className="list-decimal space-y-2 rounded-xl border border-accent/25 bg-accent-soft/60 px-4 py-3 text-sm leading-relaxed text-foreground">
      <IosInstallStep text="Unten rechts auf die 3 Punkte tippen" icon={<IosSafariMoreIcon />} />
      <IosInstallStep text="Auf „Teilen“ tippen" icon={<IosSafariShareIcon />} />
      <IosInstallStep text="„Zum Home-Bildschirm“ auswählen" icon={<IosSafariAddToHomeIcon />} />
      <IosInstallStep text="„Hinzufügen“ tippen" />
    </ol>
  )
}

function IpadInstallSteps() {
  return (
    <ol className="list-decimal space-y-2 rounded-xl border border-accent/25 bg-accent-soft/60 px-4 py-3 text-sm leading-relaxed text-foreground">
      <IosInstallStep text="Oben in Safari auf „Teilen“ tippen" icon={<IosSafariShareIcon />} />
      <IosInstallStep text="„Zum Home-Bildschirm“ auswählen" icon={<IosSafariAddToHomeIcon />} />
      <IosInstallStep text="„Hinzufügen“ tippen" />
    </ol>
  )
}

function AndroidInstallHint() {
  return (
    <p className="rounded-xl border border-accent/25 bg-accent-soft/60 px-4 py-3 text-sm leading-relaxed text-foreground">
      In Chrome: Menü → „App installieren“ oder „Zum Startbildschirm“.
    </p>
  )
}

function AppIconPreview({ prominent = false }: { prominent?: boolean }) {
  if (prominent) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src={getAppIconPath(192)}
          alt=""
          width={72}
          height={72}
          className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-2xl object-cover shadow-lg ring-4 ring-accent/25"
          priority
        />
        <p className="max-w-xs text-sm font-semibold leading-snug text-foreground">{APP_NAME}</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-surface px-3 py-2.5">
      <Image
        src={getAppIconPath(192)}
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-md ring-2 ring-accent/30"
        priority
      />
      <p className="text-sm leading-snug text-muted">{APP_NAME} zum Home-Bildschirm</p>
    </div>
  )
}

export default function PwaInstallPanel({
  showLaterButton = false,
  onLater,
  onInstalled,
  showIosDoneButton = false,
  iosInstallConfirmed = false,
  onIosDone,
  iosDoneSaving = false,
  prominent = false,
}: PwaInstallPanelProps) {
  const [canInstall, setCanInstall] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  const platform = getPwaInstallPlatform()

  useEffect(() => {
    const refresh = () => setCanInstall(canShowNativeInstallPrompt())
    refresh()
    window.addEventListener(PWA_INSTALL_PROMPT_READY_EVENT, refresh)
    return () => window.removeEventListener(PWA_INSTALL_PROMPT_READY_EVENT, refresh)
  }, [])

  async function handleInstall() {
    if (installing) return
    setInstalling(true)
    setHint(null)
    try {
      const result: PwaInstallResult = await requestPwaInstall()
      if (result === 'installed' || result === 'already-installed') {
        onInstalled?.()
        return
      }
      if (result === 'ios-manual') {
        setHint('Folge den Schritten unten in Safari.')
        return
      }
      if (result === 'dismissed') {
        setHint('Installation abgebrochen.')
        return
      }
      if (platform === 'android' && !canShowNativeInstallPrompt()) {
        setHint(`Öffne ${APP_NAME} in Chrome und warte kurz — dann erscheint „Installieren“.`)
      } else if (!isIosDevice() && !canShowNativeInstallPrompt()) {
        setHint('Warte kurz — der Installieren-Button erscheint gleich.')
      }
    } finally {
      setInstalling(false)
    }
  }

  const installButton =
    canInstall && !isIosDevice() ? (
      <button
        type="button"
        disabled={installing}
        onClick={() => void handleInstall()}
        className={buttonStyles.primaryActive}
      >
        {installing ? 'Wird geöffnet …' : `${APP_NAME} installieren`}
      </button>
    ) : null

  const iosDoneButton =
    showIosDoneButton && (platform === 'iphone' || platform === 'ipad') ? (
      <button
        type="button"
        disabled={iosInstallConfirmed || iosDoneSaving}
        onClick={onIosDone}
        className={iosInstallConfirmed ? buttonStyles.primaryInactive : buttonStyles.primaryActive}
      >
        {iosDoneSaving ? 'Wird gespeichert …' : iosInstallConfirmed ? 'Erledigt ✓' : 'Erledigt!'}
      </button>
    ) : null

  const stepBlock =
    platform === 'iphone' ? (
      <IphoneInstallSteps />
    ) : platform === 'ipad' ? (
      <IpadInstallSteps />
    ) : platform === 'android' && !canInstall ? (
      <AndroidInstallHint />
    ) : platform === 'other' ? (
      <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-muted">
        Am Handy in Safari oder Chrome hinzufügen.
      </p>
    ) : null

  if (isStandaloneDisplayMode() && !showIosDoneButton) {
    return (
      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        ✓ Schon als App eingerichtet
      </p>
    )
  }

  if (prominent) {
    return (
      <div className="flex flex-col gap-4">
        <AppIconPreview prominent />
        {installButton}
        {iosDoneButton}
        {stepBlock ? (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-accent">
              {isIosDevice() ? 'So geht’s in Safari' : 'Oder manuell'}
            </p>
            {stepBlock}
          </div>
        ) : null}
        {hint ? (
          <p className="rounded-xl border border-accent/25 bg-accent-soft/50 px-3 py-2 text-xs leading-relaxed text-foreground">
            {hint}
          </p>
        ) : null}
        {showLaterButton && onLater && !iosInstallConfirmed ? (
          <button type="button" onClick={onLater} className={buttonStyles.secondary}>
            Später
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <AppIconPreview />
      {stepBlock}
      {iosDoneButton}
      {installButton}
      {hint ? (
        <p className="rounded-xl border border-accent/25 bg-accent-soft/50 px-3 py-2 text-xs leading-relaxed text-foreground">
          {hint}
        </p>
      ) : null}
      {showLaterButton && onLater && !iosInstallConfirmed ? (
        <button type="button" onClick={onLater} className={buttonStyles.secondary}>
          Später
        </button>
      ) : null}
    </div>
  )
}
