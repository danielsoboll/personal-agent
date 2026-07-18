type FreeTrialCalloutProps = {
  className?: string
}

export default function FreeTrialCallout({ className = '' }: FreeTrialCalloutProps) {
  return (
    <div
      className={`rounded-2xl border border-orange-200/90 bg-gradient-to-br from-orange-50 via-orange-50/90 to-amber-50/80 px-4 py-4 ring-1 ring-orange-200/50 dark:border-orange-900/55 dark:from-orange-950/35 dark:via-orange-950/25 dark:to-amber-950/20 dark:ring-orange-900/30 ${className}`}
    >
      <p className="text-sm font-semibold leading-snug text-orange-950 dark:text-orange-100">
        Jetzt kostenlos für den ersten Fall prüfen!
      </p>
      <p className="mt-2 text-sm leading-6 text-orange-900/85 dark:text-orange-100/85">
        Dokument wählen, auswerten, nächste Schritte sehen — erster Fall gratis.
      </p>
    </div>
  )
}
