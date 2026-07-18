'use client'

import { useState } from 'react'

import { deleteAllLocalData } from '@/lib/localReset'
import { buttonStyles } from '@/lib/buttonStyles'

type DeleteAllSectionProps = {
  disabled?: boolean
  onDeleted: () => void
  onError: (message: string) => void
}

export default function DeleteAllSection({ disabled, onDeleted, onError }: DeleteAllSectionProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirmDelete() {
    setDeleting(true)

    try {
      await deleteAllLocalData()
      onDeleted()
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : 'Daten konnten nicht gelöscht werden.')
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
        className={buttonStyles.dangerOutline}
      >
        Alles löschen
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
      <p className="text-sm leading-6 text-red-900 dark:text-red-100">
        Wirklich alles löschen? Fälle, Fotos, Schreiben und Vorname werden vom Gerät entfernt.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={deleting}
          onClick={() => void handleConfirmDelete()}
          className={buttonStyles.dangerSolid}
        >
          {deleting ? 'Wird gelöscht …' : 'Ja, alles löschen'}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => setConfirming(false)}
          className={buttonStyles.dangerCancel}
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}
