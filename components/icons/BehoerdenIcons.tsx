import type { ReactNode, SVGProps } from 'react'

const STROKE = 1.5

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number
}

function BaseIcon({ size = 24, className, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
      {...props}
    >
      {children}
    </svg>
  )
}

/** Aktenmappe / Fall */
export function IconCase({ size, className, ...props }: IconProps) {
  return (
    <BaseIcon size={size} className={className} {...props}>
      <path
        d="M5 7.5A2.5 2.5 0 0 1 7.5 5H10l1.2 2H16.5A2.5 2.5 0 0 1 19 9.5V17.5A2.5 2.5 0 0 1 16.5 20h-9A2.5 2.5 0 0 1 5 17.5V7.5Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path d="M8.5 11h7" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <path d="M8.5 14h4.5" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
    </BaseIcon>
  )
}

/** Person / Vorname */
export function IconPerson({ size, className, ...props }: IconProps) {
  return (
    <BaseIcon size={size} className={className} {...props}>
      <circle cx="12" cy="8.5" r="3" stroke="currentColor" strokeWidth={STROKE} />
      <path
        d="M6 19c0-3.314 2.686-5.5 6-5.5s6 2.186 6 5.5"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </BaseIcon>
  )
}

/** Kamera / Scan */
export function IconScan({ size, className, ...props }: IconProps) {
  return (
    <BaseIcon size={size} className={className} {...props}>
      <rect x="4" y="7" width="16" height="12" rx="2.2" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M9 7l1.2-2h3.6L15 7" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth={STROKE} />
    </BaseIcon>
  )
}

/** Auswertung / Prüfung */
export function IconReview({ size, className, ...props }: IconProps) {
  return (
    <BaseIcon size={size} className={className} {...props}>
      <path
        d="M8 4h8l2 2v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path d="M9 10h6M9 13.5h4" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      <circle cx="15.5" cy="16.5" r="2.5" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M17.2 18.2 18.5 19.5" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
    </BaseIcon>
  )
}

/** KI-Kern — geheimnisvoller Knoten mit Verbindungen */
export function IconAiMystery({ size, className, ...props }: IconProps) {
  return (
    <BaseIcon size={size} className={className} {...props}>
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth={STROKE} />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" opacity="0.85" />
      <path
        d="M12 4.5v2.2M12 17.3v2.2M4.5 12h2.2M17.3 12h2.2"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M7.1 7.1l1.55 1.55M15.35 15.35l1.55 1.55M16.9 7.1l-1.55 1.55M8.65 15.35l-1.55 1.55"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="12" cy="4.5" r="1.15" stroke="currentColor" strokeWidth={1.15} />
      <circle cx="19.5" cy="12" r="1.15" stroke="currentColor" strokeWidth={1.15} />
      <circle cx="12" cy="19.5" r="1.15" stroke="currentColor" strokeWidth={1.15} />
      <circle cx="4.5" cy="12" r="1.15" stroke="currentColor" strokeWidth={1.15} />
      <path
        d="M12 4.5 12 8.8M19.5 12 15.2 12M12 19.5 12 15.2M4.5 12 8.8 12"
        stroke="currentColor"
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth={1} strokeDasharray="2.5 3.5" opacity="0.35" />
    </BaseIcon>
  )
}

/** KI / intelligente Analyse — Funken-Symbol */
export function IconAi({ size, className, ...props }: IconProps) {
  return (
    <BaseIcon size={size} className={className} {...props}>
      <path
        d="M12 3 13.15 8.35 18.5 9.5 13.15 10.65 12 16 10.85 10.65 5.5 9.5 10.85 8.35 12 3Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M18.75 4.25 19.2 5.95 20.9 6.4 19.2 6.85 18.75 8.55 18.3 6.85 16.6 6.4 18.3 5.95 18.75 4.25Z"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
      <path
        d="M7.25 15.75 7.65 17.2 9.1 17.6 7.65 18 7.25 19.45 6.85 18 5.4 17.6 6.85 17.2 7.25 15.75Z"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
    </BaseIcon>
  )
}

/** Bibliothek */
export function IconLibrary({ size, className, ...props }: IconProps) {
  return (
    <BaseIcon size={size} className={className} {...props}>
      <path d="M5 6.5h5v11H6.5A1.5 1.5 0 0 1 5 16V6.5Z" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M10 6.5h5v11h-3.5A1.5 1.5 0 0 1 10 16V6.5Z" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M15 6.5h4v11h-2.5A1.5 1.5 0 0 1 15 16V6.5Z" stroke="currentColor" strokeWidth={STROKE} />
    </BaseIcon>
  )
}

/** Start / Übersicht */
export function IconHome({ size, className, ...props }: IconProps) {
  return (
    <BaseIcon size={size} className={className} {...props}>
      <path
        d="M4.5 10.5 12 5l7.5 5.5V18a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V10.5Z"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path d="M10 19.5V13h4v6.5" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
    </BaseIcon>
  )
}

/** Brief / Behördenpost Markenzeichen (Header) */
export function IconBrandMark({ size, className, ...props }: IconProps) {
  return (
    <BaseIcon size={size} className={className} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth={STROKE} />
      <path d="M3 8.5 12 14l9-5.5" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
      <circle cx="17.5" cy="7" r="1.6" fill="currentColor" opacity="0.85" />
    </BaseIcon>
  )
}

export type PageIconName = 'case' | 'person' | 'scan' | 'review' | 'library' | 'home'

const PAGE_ICONS: Record<PageIconName, typeof IconCase> = {
  case: IconCase,
  person: IconPerson,
  scan: IconScan,
  review: IconReview,
  library: IconLibrary,
  home: IconHome,
}

export function PageIcon({ name, ...props }: IconProps & { name: PageIconName }) {
  const Icon = PAGE_ICONS[name]
  return <Icon {...props} />
}
