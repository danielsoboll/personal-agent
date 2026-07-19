'use client'

import { useState } from 'react'

import {
  formatConfirmedRelationSentence,
  formatEventDateLong,
  formatRelationCompactLine,
  relationBadgeLabel,
  type FallakteRelationView,
} from '@/lib/fallakteRelationDisplay'
import { FALLAKTE_RELATION_TYPE_LABELS } from '@/lib/fallakteRelationTypes'
import type { FallakteRelation } from '@/lib/fallakteRelationTypes'

type FallakteRelationsBlockProps = {
  views: FallakteRelationView[]
  onEdit?: (relation: FallakteRelation) => void
  onRemove?: (relation: FallakteRelation) => void
  /** Kompaktere Darstellung in bestätigten Zeilen */
  dense?: boolean
}

export default function FallakteRelationsBlock({
  views,
  onEdit,
  onRemove,
  dense = false,
}: FallakteRelationsBlockProps) {
  const [expanded, setExpanded] = useState(false)
  const [openDetailId, setOpenDetailId] = useState<string | null>(null)

  if (views.length === 0) return null

  const visible = expanded ? views : views.slice(0, 2)
  const hiddenCount = views.length - visible.length

  return (
    <div className={dense ? 'mt-1 space-y-1' : 'mt-2 space-y-1.5'}>
      {visible.map(({ relation, target }) => {
        const detailOpen = openDetailId === relation.id
        const sentence = target
          ? formatConfirmedRelationSentence(relation.relationType, target)
          : 'Bezieht sich auf ein nicht mehr vorhandenes Ereignis.'
        const compact = target
          ? formatRelationCompactLine(relation.relationType, target)
          : sentence

        return (
          <div key={relation.id} className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="rounded border border-border/80 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
                {relationBadgeLabel(relation.relationType)}
              </span>
              <p className={`min-w-0 text-xs leading-5 text-foreground/80 ${dense ? '' : 'sm:text-sm'}`}>
                {sentence}
              </p>
            </div>
            <p className="sr-only">{compact}</p>

            <div className="mt-0.5 flex flex-wrap gap-x-2">
              <button
                type="button"
                onClick={() => setOpenDetailId(detailOpen ? null : relation.id)}
                className="inline-flex min-h-9 items-center text-xs font-medium text-accent"
              >
                {detailOpen ? 'Details ausblenden' : 'Details'}
              </button>
              {onEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(relation)}
                  className="inline-flex min-h-9 items-center text-xs font-medium text-accent"
                >
                  Beziehung ändern
                </button>
              ) : null}
              {onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(relation)}
                  className="inline-flex min-h-9 items-center text-xs font-medium text-red-700 dark:text-red-300"
                >
                  Beziehung entfernen
                </button>
              ) : null}
            </div>

            {detailOpen ? (
              <div className="mt-1.5 space-y-1 rounded-lg border border-border/70 bg-surface/80 px-2.5 py-2 text-xs leading-5 text-foreground/85">
                <p>
                  <span className="font-medium">Beziehung: </span>
                  {FALLAKTE_RELATION_TYPE_LABELS[relation.relationType]}
                </p>
                {target ? (
                  <>
                    <p>
                      <span className="font-medium">Ziel: </span>
                      {formatEventDateLong(target)} · {target.title}
                    </p>
                    <p className="whitespace-pre-wrap text-foreground/80">{target.description}</p>
                  </>
                ) : (
                  <p className="text-muted">Zielereignis nicht gefunden.</p>
                )}
                {relation.topicLabel ? (
                  <p>
                    <span className="font-medium">Sachthema: </span>
                    {relation.topicLabel}
                  </p>
                ) : null}
                {relation.reason ? (
                  <p>
                    <span className="font-medium">Begründung: </span>
                    {relation.reason}
                  </p>
                ) : null}
                <p className="text-muted">
                  Verknüpft am{' '}
                  {new Intl.DateTimeFormat('de-DE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Europe/Berlin',
                  }).format(new Date(relation.createdAt))}
                </p>
              </div>
            ) : null}
          </div>
        )
      })}

      {hiddenCount > 0 && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs font-medium text-accent"
        >
          Weitere Zusammenhänge anzeigen ({hiddenCount})
        </button>
      ) : null}
      {expanded && views.length > 2 ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs font-medium text-accent"
        >
          Weniger anzeigen
        </button>
      ) : null}
    </div>
  )
}
