'use client'

import { useState } from 'react'

import { deleteCaseCompletely } from '@/lib/caseDelete'

type DeleteCaseSectionProps = {
  caseId: string
  caseTitle: string
  disabled?: boolean
  onDeleted: () => void
  onError: (message: string) => void
}

export default function DeleteCaseSection({
  caseId,
  caseTitle,
  disabled,
  onDeleted,
  onError,
}: DeleteCaseSectionProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirmDelete() {
    setDeleting(true)

    try {
      await deleteCaseCompletely(caseId)
      onDeleted()
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : 'Fall konnte nicht gelöscht werden.')
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        disabled={disabled || deleting}
        onClick={() => setConfirming(true)}
        className="flex h-12 w-full items-center justify-center rounded-2xl border border-red-300 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        Fall löschen
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
      <p className="text-sm leading-7 text-red-900 dark:text-red-100">
        Fall „{caseTitle}“ wirklich löschen? Fallakte, gespeicherte KI-Auswertung, Scan-Fotos und zugehörige
        Schreiben in der Bibliothek werden unwiderruflich vom Gerät entfernt.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={deleting}
          onClick={() => void handleConfirmDelete()}
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
        >
          {deleting ? 'Wird gelöscht …' : 'Ja, Fall löschen'}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => setConfirming(false)}
          className="flex h-12 w-full items-center justify-center rounded-2xl border border-red-300 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/50"
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}
