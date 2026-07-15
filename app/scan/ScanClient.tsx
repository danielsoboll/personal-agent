'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'

import AnalyzingOverlay from '@/components/AnalyzingOverlay'
import OnboardingShell, { PageIntro, PrivacyNote } from '@/components/onboarding/OnboardingShell'
import { buttonStyles } from '@/lib/buttonStyles'
import { usePlusDiscoverHeader } from '@/hooks/usePlusDiscoverHeader'
import { analyzeCurrentPhotos } from '@/lib/analyzeClient'
import { logUserActivity } from '@/lib/activityLog'
import { scheduleCaseFileReorganizeAfterAnalyze } from '@/lib/caseFileReorganizeClient'
import type { AnalyzeIntent } from '@/lib/analyzeTypes'
import {
  getActiveCase,
  saveCaseFileContent,
  saveLatestReview,
  type StoredCase,
} from '@/lib/localCases'
import {
  MAX_FOLLOWUP_PHOTOS,
  MAX_INITIAL_PHOTOS,
  addDocumentPhoto,
  clearDocumentPhotos,
  createPhotoPreviewUrl,
  listDocumentPhotos,
  removeDocumentPhoto,
  type StoredPhoto,
} from '@/lib/localDocuments'
import { UPLOAD_ACCEPT, uploadFileToImageBlobs } from '@/lib/documentUpload'
import { getStoredProfileName } from '@/lib/localProfile'

type PhotoPreview = StoredPhoto & {
  previewUrl: string
}

function parseIntent(value: string | null): AnalyzeIntent {
  if (value === 'current_more' || value === 'historical') return value
  return 'initial'
}

function openCamera(input: HTMLInputElement | null) {
  if (!input) return
  window.setTimeout(() => input.click(), 150)
}

export default function ScanClient() {
  const router = useRouter()
  const plus = usePlusDiscoverHeader()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [activeCase, setActiveCase] = useState<StoredCase | null>(null)
  const [profileName, setProfileName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const intent = parseIntent(searchParams.get('intent'))
  const maxPhotos = intent === 'initial' ? MAX_INITIAL_PHOTOS : MAX_FOLLOWUP_PHOTOS
  const canAddMore = photos.length < maxPhotos

  const copy = useMemo(() => {
    if (intent === 'current_more') {
      return {
        title: 'Weitere Fotos zum aktuellen Schreiben',
        heading: 'Ergänze das aktuelle Schreiben',
        hint: `Bis zu ${MAX_FOLLOWUP_PHOTOS} Seiten. Foto aufnehmen oder Datei hochladen (Bild/PDF).`,
      }
    }

    if (intent === 'historical') {
      return {
        title: 'Ältere Dokumente erfassen',
        heading: 'Fotografiere ältere Unterlagen für den Hintergrund',
        hint: `Bis zu ${MAX_FOLLOWUP_PHOTOS} Seiten. Foto aufnehmen oder Datei hochladen (Bild/PDF).`,
      }
    }

    return {
      title: 'Dokument erfassen',
      heading: 'Fotografiere oder lade dein Dokument hoch',
      hint: `Bis zu ${MAX_INITIAL_PHOTOS} Seiten. Foto aufnehmen oder Datei hochladen — auch PDFs mit mehreren Seiten.`,
    }
  }, [intent])

  useEffect(() => {
    async function loadPhotos() {
      const currentCase = await getActiveCase()
      if (!currentCase) {
        router.replace('/')
        return
      }

      setActiveCase(currentCase)
      setProfileName(currentCase.userName || getStoredProfileName())

      const storedPhotos = await listDocumentPhotos(currentCase.id)
      setPhotos(
        storedPhotos.map((photo) => ({
          ...photo,
          previewUrl: createPhotoPreviewUrl(photo.blob),
        })),
      )
      setLoading(false)
    }

    void loadPhotos()
  }, [router])

  useEffect(() => {
    return () => {
      for (const photo of photos) {
        URL.revokeObjectURL(photo.previewUrl)
      }
    }
  }, [photos])

  async function saveDocumentBlob(blob: Blob): Promise<boolean> {
    setBusy(true)
    setError('')

    try {
      const saved = await addDocumentPhoto(blob, maxPhotos)
      const previewUrl = createPhotoPreviewUrl(saved.blob)
      const committed: PhotoPreview = { ...saved, previewUrl }
      setPhotos((current) => [...current, committed])
      return true
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Datei konnte nicht gespeichert werden.')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || analyzing || busy) return

    if (photos.length >= maxPhotos) {
      setError(`Maximal ${maxPhotos} Seiten möglich.`)
      return
    }

    const saved = await saveDocumentBlob(file)
    if (!saved) return

    if (photos.length + 1 >= maxPhotos) {
      setError(`Maximal ${maxPhotos} Seiten erreicht. Tippe auf Prüfen.`)
    }
  }

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (files.length === 0 || analyzing || busy) return

    setBusy(true)
    setError('')

    let added = 0
    let remaining = maxPhotos - photos.length
    const newPreviews: PhotoPreview[] = []

    try {
      for (const file of files) {
        if (remaining <= 0) {
          setError(`Maximal ${maxPhotos} Seiten möglich — einige Dateien wurden nicht hinzugefügt.`)
          break
        }

        const blobs = await uploadFileToImageBlobs(file)

        for (const blob of blobs) {
          if (remaining <= 0) {
            setError(`Maximal ${maxPhotos} Seiten möglich — einige Seiten wurden nicht hinzugefügt.`)
            break
          }

          const saved = await addDocumentPhoto(blob, maxPhotos)
          newPreviews.push({ ...saved, previewUrl: createPhotoPreviewUrl(saved.blob) })
          added += 1
          remaining -= 1
        }
      }

      if (newPreviews.length > 0) {
        setPhotos((current) => [...current, ...newPreviews])
      }

      if (added > 0 && photos.length + added >= maxPhotos) {
        setError(`Maximal ${maxPhotos} Seiten erreicht. Tippe auf Prüfen.`)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Datei konnte nicht verarbeitet werden.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemovePhoto(id: string) {
    if (analyzing || busy) return

    const target = photos.find((photo) => photo.id === id)
    if (target) {
      URL.revokeObjectURL(target.previewUrl)
    }

    await removeDocumentPhoto(id)
    setPhotos((current) => current.filter((photo) => photo.id !== id))
  }

  async function handleReview() {
    if (analyzing || photos.length === 0) return

    const name = (activeCase?.userName || profileName).trim()
    if (!name || !activeCase) {
      router.push('/')
      return
    }

    setError('')
    setAnalyzing(true)

    try {
      const result = await analyzeCurrentPhotos({ intent })
      const photoCount = photos.length

      await saveCaseFileContent(activeCase.id, result.caseFileContent)
      await saveLatestReview(activeCase.id, {
        ...result,
        analyzedAt: Date.now(),
        intent,
        photoCount,
      })

      await clearDocumentPhotos(activeCase.id)

      logUserActivity('photos_analyzed', {
        case_id: activeCase.id,
        intent,
        photo_count: photoCount,
      })

      for (const photo of photos) {
        URL.revokeObjectURL(photo.previewUrl)
      }
      setPhotos([])

      scheduleCaseFileReorganizeAfterAnalyze(activeCase.id, intent)

      router.push('/pruefen?from=scan')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Prüfung fehlgeschlagen.')
    } finally {
      setAnalyzing(false)
    }
  }

  const isInteractionLocked = loading || busy || analyzing

  return (
    <>
      {analyzing ? <AnalyzingOverlay /> : null}

      <OnboardingShell
        title={copy.title}
        subtitle={activeCase ? activeCase.title : profileName && profileName !== 'Nutzer' ? `Hallo ${profileName}` : 'Behördenpost'}
        headerAction={plus.headerAction}
        backNav={
          loading
            ? undefined
            : activeCase?.latestReview || intent !== 'initial'
              ? { href: '/pruefen', label: 'Zurück zur Auswertung' }
              : { href: '/', label: 'Zurück zur Fallübersicht' }
        }
        footer={
          <div className="space-y-2">
            {canAddMore && photos.length > 0 ? (
              <>
                <button
                  type="button"
                  disabled={isInteractionLocked}
                  onClick={() => openCamera(inputRef.current)}
                  className={buttonStyles.secondary}
                >
                  Neues Foto
                </button>
                <button
                  type="button"
                  disabled={isInteractionLocked}
                  onClick={() => uploadInputRef.current?.click()}
                  className={buttonStyles.secondary}
                >
                  Datei hochladen
                </button>
              </>
            ) : null}
            <button
              type="button"
              disabled={isInteractionLocked || photos.length === 0}
              aria-disabled={isInteractionLocked || photos.length === 0 || undefined}
              onClick={() => void handleReview()}
              className={
                isInteractionLocked || photos.length === 0
                  ? buttonStyles.primaryInactive
                  : buttonStyles.primaryActive
              }
            >
              Jetzt prüfen{photos.length > 0 ? ` (${photos.length} Seite${photos.length === 1 ? '' : 'n'})` : ''}
            </button>
          </div>
        }
      >
        <section className="flex flex-1 flex-col gap-6">
          <PageIntro title={copy.heading} description={copy.hint} />

          <PrivacyNote variant="analysis" />

          <div
            className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${analyzing ? 'pointer-events-none opacity-60' : ''}`}
          >
            {photos.map((photo, index) => (
              <figure
                key={photo.id}
                className="relative overflow-hidden rounded-2xl border border-border bg-surface"
              >
                <Image
                  src={photo.previewUrl}
                  alt={`Dokumentfoto ${index + 1}`}
                  width={240}
                  height={320}
                  unoptimized
                  className="aspect-[3/4] h-full w-full object-cover"
                />
                <figcaption className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white">
                  {index + 1}
                </figcaption>
                {!analyzing ? (
                  <button
                    type="button"
                    aria-label={`Foto ${index + 1} entfernen`}
                    onClick={() => void handleRemovePhoto(photo.id)}
                    className={`absolute right-2 top-2 ${buttonStyles.photoRemove}`}
                  >
                    ✕
                  </button>
                ) : null}
              </figure>
            ))}

            {photos.length === 0 && canAddMore ? (
              <>
                <button
                  type="button"
                  disabled={isInteractionLocked}
                  onClick={() => openCamera(inputRef.current)}
                  className={buttonStyles.photoCaptureTile}
                >
                  <span className="text-3xl leading-none" aria-hidden>
                    📷
                  </span>
                  <span>{busy ? 'Wird gespeichert …' : 'Foto aufnehmen'}</span>
                </button>
                <button
                  type="button"
                  disabled={isInteractionLocked}
                  onClick={() => uploadInputRef.current?.click()}
                  className={buttonStyles.photoCaptureTile}
                >
                  <span className="text-3xl leading-none" aria-hidden>
                    📄
                  </span>
                  <span>{busy ? 'Wird verarbeitet …' : 'Datei hochladen'}</span>
                </button>
              </>
            ) : null}
          </div>

          <p className="text-sm text-muted">
            {photos.length} von {maxPhotos} Seiten
            {photos.length === 0 ? ' — Foto aufnehmen oder Datei hochladen (JPG, PNG, PDF).' : ''}
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handlePhotoSelected(event)}
          />

          <input
            ref={uploadInputRef}
            type="file"
            accept={UPLOAD_ACCEPT}
            multiple
            className="hidden"
            onChange={(event) => void handleFilesSelected(event)}
          />

          {error ? (
            <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          ) : null}
        </section>
      </OnboardingShell>
      {plus.portals}
    </>
  )
}
