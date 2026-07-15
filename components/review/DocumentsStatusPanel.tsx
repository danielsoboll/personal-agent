import type { DocumentsStatus } from '@/lib/analyzeTypes'

const STATUS_COPY: Record<
  DocumentsStatus,
  { title: string; className: string }
> = {
  not_needed: {
    title: 'Weitere Unterlagen brauchst du gerade nicht',
    className:
      'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/25',
  },
  recommended: {
    title: 'Weitere Unterlagen wären hilfreich',
    className: 'border-sky-200 bg-sky-50/80 dark:border-sky-900/50 dark:bg-sky-950/20',
  },
  required: {
    title: 'Weitere Unterlagen fehlen noch',
    className: 'border-amber-200 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/25',
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
      <h3 className="text-base font-semibold text-foreground">{copy.title}</h3>
      <p className="mt-3 text-sm leading-7 text-foreground">{comment}</p>
      {suggestions && status !== 'not_needed' ? (
        <div className="mt-4 rounded-xl border border-border/60 bg-surface/70 px-4 py-3 dark:bg-surface/40">
          <p className="text-sm font-medium text-foreground">Das könnte helfen</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{suggestions}</p>
        </div>
      ) : null}
    </div>
  )
}
