import type { DocumentsStatus } from '@/lib/analyzeTypes'
import { IconLibrary } from '@/components/icons/BehoerdenIcons'

const STATUS_COPY: Record<
  DocumentsStatus,
  { title: string; className: string; iconClass: string }
> = {
  not_needed: {
    title: 'Keine weiteren Unterlagen nötig',
    className:
      'border-emerald-300 bg-emerald-100/90 dark:border-emerald-700 dark:bg-emerald-950/40',
    iconClass: 'text-emerald-700 dark:text-emerald-300',
  },
  recommended: {
    title: 'Weitere Unterlagen helfen',
    className: 'border-amber-300 bg-amber-50 dark:border-amber-700/80 dark:bg-amber-950/35',
    iconClass: 'text-amber-700 dark:text-amber-200',
  },
  required: {
    title: 'Weitere Unterlagen nötig',
    className: 'border-amber-400 bg-amber-100 dark:border-amber-600 dark:bg-amber-950/45',
    iconClass: 'text-amber-800 dark:text-amber-200',
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
    <div className={`rounded-2xl border-2 px-4 py-3.5 shadow-sm ${copy.className}`}>
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70 dark:bg-black/20 ${copy.iconClass}`}
          aria-hidden
        >
          <IconLibrary size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-6 text-foreground">{copy.title}</h3>
          {comment.trim() ? (
            <p className="mt-1.5 text-sm leading-6 text-foreground/90">{comment}</p>
          ) : null}
          {suggestions && status !== 'not_needed' ? (
            <p className="mt-2 text-sm leading-6 text-foreground">
              <span className="font-semibold">z. B.</span> {suggestions}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
