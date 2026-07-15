import type { DocumentsStatus } from '@/lib/analyzeTypes'

const STATUS_COPY: Record<DocumentsStatus, { title: string; className: string }> = {
  not_needed: {
    title: 'Keine weiteren Unterlagen nötig',
    className:
      'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/25',
  },
  recommended: {
    title: 'Weitere Unterlagen helfen',
    className: 'border-sky-200 bg-sky-50/80 dark:border-sky-900/50 dark:bg-sky-950/20',
  },
  required: {
    title: 'Unterlagen fehlen noch',
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
    <div className={`rounded-2xl border-2 p-4 ${copy.className}`}>
      <h3 className="text-base font-semibold text-foreground">{copy.title}</h3>
      {comment.trim() ? <p className="mt-2 text-sm leading-6 text-foreground">{comment}</p> : null}
      {suggestions && status !== 'not_needed' ? (
        <p className="mt-3 text-sm font-medium leading-6 text-foreground">{suggestions}</p>
      ) : null}
    </div>
  )
}
