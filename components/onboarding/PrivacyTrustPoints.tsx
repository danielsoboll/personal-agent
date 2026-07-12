import Link from 'next/link'

/** Nur Formulierungen, die zum tatsächlichen App-Verhalten passen. */
const TRUST_POINTS = [
  'Deine Fälle, Briefe und Bewertungen bleiben auf deinem Handy gespeichert',
  'Fotos werden nur zur Auswertung übermittelt — nicht dauerhaft bei uns abgelegt',
  'Verarbeitete Fotos werden nach der Prüfung vom Gerät gelöscht',
  'Wir verkaufen deine Daten nicht',
] as const

export default function PrivacyTrustPoints() {
  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/25">
      <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">Deine Daten, dein Gerät</p>
      <ul className="mt-4 space-y-3">
        {TRUST_POINTS.map((point) => (
          <li key={point} className="flex items-start gap-3 text-sm leading-6 text-emerald-950 dark:text-emerald-50/95">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white dark:bg-emerald-500"
              aria-hidden
            >
              ✓
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-5 text-emerald-900/80 dark:text-emerald-200/80">
        Ausführliche Informationen in unserer{' '}
        <Link href="/datenschutz" className="font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-200">
          Datenschutzerklärung
        </Link>
        .
      </p>
    </div>
  )
}
