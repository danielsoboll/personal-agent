/** LifeXP-3D: native Buttons */
export const PRESSABLE_3D = 'app-btn'

/** LifeXP-3D: Link-Buttons (zusätzlich zu app-btn) */
export const PRESSABLE_3D_LINK = 'lifexp-pressable-3d'

const btn3d = `${PRESSABLE_3D} ${PRESSABLE_3D_LINK}`
const btnFocus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

/** Sekundäre Steintafel — helle Fläche im App-Farbschema */
const surface3d =
  'border-2 border-border bg-gradient-to-b from-surface via-slate-50 to-slate-200/90 ring-1 ring-border/30 hover:border-accent/70 hover:from-white hover:via-accent-soft/50 hover:to-slate-200/95 dark:border-slate-600 dark:from-slate-800 dark:via-slate-800 dark:to-slate-950 dark:ring-slate-700/40 dark:hover:border-accent/60 dark:hover:from-slate-700 dark:hover:via-slate-800 dark:hover:to-slate-900'

export const buttonStyles = {
  primaryActive: `${btn3d} flex h-14 w-full items-center justify-center rounded-2xl border-2 border-blue-950 bg-gradient-to-b from-blue-700 via-accent to-blue-950 text-base font-semibold text-white hover:border-blue-900 hover:from-blue-600 hover:via-blue-800 hover:to-blue-950 dark:border-blue-400/80 dark:from-blue-300 dark:via-accent dark:to-blue-900 dark:text-slate-900 dark:hover:border-blue-300 dark:hover:from-blue-200 dark:hover:via-blue-400 dark:hover:to-blue-800 ${btnFocus}`,
  primaryOrange: `${btn3d} flex h-14 w-full items-center justify-center rounded-2xl border-2 border-orange-800 bg-gradient-to-b from-orange-500 via-orange-600 to-orange-800 text-base font-semibold text-white hover:border-orange-700 hover:from-orange-400 hover:via-orange-500 hover:to-orange-900 dark:border-orange-500/80 dark:from-orange-400 dark:via-orange-500 dark:to-orange-900 dark:text-white dark:hover:border-orange-400 dark:hover:from-orange-300 dark:hover:via-orange-400 dark:hover:to-orange-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500`,
  primaryOrangeInactive: `${PRESSABLE_3D} flex h-14 w-full cursor-not-allowed items-center justify-center rounded-2xl border-2 border-border bg-gradient-to-b from-slate-100 to-slate-200 text-base font-semibold text-muted opacity-80 dark:from-slate-800 dark:to-slate-900`,
  primaryInactive: `${PRESSABLE_3D} flex h-14 w-full cursor-not-allowed items-center justify-center rounded-2xl border-2 border-border bg-gradient-to-b from-slate-100 to-slate-200 text-base font-semibold text-muted opacity-80 dark:from-slate-800 dark:to-slate-900`,
  secondary: `${btn3d} flex h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-foreground hover:text-accent ${surface3d} ${btnFocus}`,
  accentSoft: `${btn3d} inline-flex h-12 items-center justify-center rounded-2xl border-2 border-accent/45 bg-gradient-to-b from-accent-soft via-blue-100/80 to-blue-200/70 px-6 text-sm font-semibold text-accent ring-1 ring-accent/15 hover:border-accent hover:from-accent-soft hover:via-blue-100 hover:to-blue-300/80 hover:text-accent dark:border-accent/55 dark:from-accent-soft dark:via-slate-800 dark:to-slate-900 dark:text-accent dark:hover:border-accent dark:hover:from-slate-700 dark:hover:via-slate-800 dark:hover:to-slate-950 ${btnFocus}`,
  header: `${btn3d} shrink-0 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:text-accent ${surface3d} ${btnFocus}`,
  admin: `${btn3d} inline-flex h-12 min-w-[8.5rem] items-center justify-center rounded-xl px-6 text-base font-semibold text-foreground hover:text-accent ${surface3d} ${btnFocus}`,
  dangerOutline: `${btn3d} flex h-12 w-full items-center justify-center rounded-2xl border-2 border-red-300 bg-gradient-to-b from-red-50 to-red-100 text-sm font-semibold text-red-700 ring-1 ring-red-200/60 hover:border-red-400 hover:from-red-100 hover:to-red-200 dark:border-red-900/70 dark:from-red-950/60 dark:to-red-950 dark:text-red-300 dark:hover:border-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500`,
  dangerSolid: `${btn3d} flex h-12 w-full items-center justify-center rounded-2xl border-2 border-red-600 bg-gradient-to-b from-red-500 to-red-700 text-sm font-semibold text-white hover:border-red-700 hover:from-red-600 hover:to-red-800 dark:border-red-700 dark:from-red-600 dark:to-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500`,
  dangerCancel: `${btn3d} flex h-12 w-full items-center justify-center rounded-2xl border-2 border-red-300 bg-gradient-to-b from-red-50/90 to-red-100/80 text-sm font-semibold text-red-800 hover:border-red-400 hover:from-red-100 hover:to-red-200 dark:border-red-800 dark:from-red-950/50 dark:to-red-950 dark:text-red-200 dark:hover:border-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400`,
  stepPrepare: `${btn3d} mt-3 rounded-xl border-2 border-accent/45 bg-gradient-to-b from-accent-soft to-blue-100/70 px-3 py-2 text-sm font-semibold text-accent ring-1 ring-accent/15 hover:border-accent hover:from-accent-soft hover:to-blue-200/80 hover:text-accent dark:border-accent/55 dark:from-accent-soft dark:to-slate-900 dark:hover:border-accent ${btnFocus}`,
  libraryItem: `${PRESSABLE_3D} lifexp-tile-3d w-full rounded-2xl border-2 border-border bg-gradient-to-b from-surface via-slate-50 to-slate-200/80 px-4 py-4 text-left ring-1 ring-border/25 hover:border-accent/70 hover:from-white hover:via-accent-soft/30 hover:to-slate-200/90 dark:border-slate-600 dark:from-slate-800 dark:via-slate-800 dark:to-slate-950 dark:hover:border-accent/60 ${btnFocus}`,
  caseDoneToggle: `${btn3d} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 text-sm ${surface3d}`,
  themeToggle: `${btn3d} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${surface3d} ${btnFocus}`,
} as const
