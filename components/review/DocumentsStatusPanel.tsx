import type { DocumentsStatus } from '@/lib/analyzeTypes'

const STATUS_COPY: Record<
  DocumentsStatus,
  { title: string; className: string; badgeClassName: string }
> = {
  not_needed: {
    title: 'Weitere Unterlagen nicht notwendig',
    className:
      'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/25',
    badgeClassName:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  },
  recommended: {
    title: 'Weitere Unterlagen sinnvoll',
    className: 'border-sky-200 bg-sky-50/80 dark:border-sky-900/50 dark:bg-sky-950/20',
    badgeClassName: 'bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200',
  },
  required: {
    title: 'Weitere Unterlagen notwendig',
    className: 'border-amber-200 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/25',
    badgeClassName: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
  },
}

type DocumentsStatusPanelProps = {
  status: DocumentsStatus
  comment: string
  requestedDocuments?: string
}

export default function DocumentsStatusPanel({
  status,
  comment,
  requestedDocuments,
}: DocumentsStatusPanelProps) {
  const copy = STATUS_COPY[status]
  const suggestions = requestedDocuments?.trim()

  return (
    <div className={`rounded-2xl border p-5 ${copy.className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-foreground">{copy.title}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${copy.badgeClassName}`}>
          KI-Einschätzung
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-foreground">{comment}</p>
      {suggestions && status !== 'not_needed' ? (
        <div className="mt-4 rounded-xl border border-border/60 bg-surface/70 px-4 py-3 dark:bg-surface/40">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Vorschläge</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{suggestions}</p>
        </div>
      ) : null}
    </div>
  )
}
