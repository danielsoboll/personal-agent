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
