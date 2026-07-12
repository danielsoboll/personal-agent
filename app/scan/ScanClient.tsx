'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'

import AnalyzingOverlay from '@/components/AnalyzingOverlay'
import OnboardingShell, { PrimaryButton, PrivacyNote } from '@/components/onboarding/OnboardingShell'
import { analyzeCurrentPhotos } from '@/lib/analyzeClient'
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
import { getStoredProfileName } from '@/lib/localProfile'

type PhotoPreview = StoredPhoto & {
  previewUrl: string
}

type PendingPhoto = {
  blob: Blob
  previewUrl: string
}

function parseIntent(value: string | null): AnalyzeIntent {
  if (value === 'current_more' || value === 'historical') return value
  return 'initial'
}

function triggerCameraInput(input: HTMLInputElement | null) {
  if (!input) return
  window.setTimeout(() => input.click(), 120)
}

export default function ScanClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto | null>(null)
  const [activeCase, setActiveCase] = useState<StoredCase | null>(null)
  const [profileName, setProfileName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const intent = parseIntent(searchParams.get('intent'))
  const maxPhotos = intent === 'initial' ? MAX_INITIAL_PHOTOS : MAX_FOLLOWUP_PHOTOS
  const inPreview = pendingPhoto !== null
  const canTakeNextAfterAccept = photos.length < maxPhotos - 1

  const copy = useMemo(() => {
    if (intent === 'current_more') {
      return {
        title: 'Weitere Fotos zum aktuellen Schreiben',
        heading: 'Ergänze das aktuelle Schreiben',
        hint: `Du kannst bis zu ${MAX_FOLLOWUP_PHOTOS} weitere Fotos aufnehmen — z. B. fehlende Seiten oder Anlagen.`,
      }
    }

    if (intent === 'historical') {
      return {
        title: 'Ältere Dokumente erfassen',
        heading: 'Fotografiere ältere Unterlagen für den Hintergrund',
        hint: `Bis zu ${MAX_FOLLOWUP_PHOTOS} Fotos — z. B. frühere Schreiben, E-Mails oder Verträge.`,
      }
    }

    return {
      title: 'Dokument fotografieren',
      heading: 'Fotografiere das Dokument, den Antrag oder die E-Mail',
      hint: `Du kannst bis zu ${MAX_INITIAL_PHOTOS} Fotos aufnehmen — zum Beispiel Vorder- und Rückseite oder mehrere Seiten.`,
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
      if (pendingPhoto) {
        URL.revokeObjectURL(pendingPhoto.previewUrl)
      }
    }
  }, [photos, pendingPhoto])

  function discardPending() {
    if (pendingPhoto) {
      URL.revokeObjectURL(pendingPhoto.previewUrl)
      setPendingPhoto(null)
    }
  }

  async function commitPendingPhoto(): Promise<{ photo: PhotoPreview; totalCount: number } | null> {
    if (!pendingPhoto) return null

    setBusy(true)
    setError('')

    try {
      const saved = await addDocumentPhoto(pendingPhoto.blob, maxPhotos)
      const previewUrl = createPhotoPreviewUrl(saved.blob)
      const committed: PhotoPreview = { ...saved, previewUrl }
      const totalCount = photos.length + 1
      setPhotos((current) => [...current, committed])
      setPendingPhoto(null)
      return { photo: committed, totalCount }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Foto konnte nicht gespeichert werden.')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || analyzing || busy) return

    if (photos.length >= maxPhotos) {
      setError(`Maximal ${maxPhotos} Fotos möglich.`)
      return
    }

    setError('')
    discardPending()

    const previewUrl = createPhotoPreviewUrl(file)
    setPendingPhoto({ blob: file, previewUrl })
  }

  async function handleRemovePhoto(id: string) {
    if (analyzing || inPreview) return

    const target = photos.find((photo) => photo.id === id)
    if (target) {
      URL.revokeObjectURL(target.previewUrl)
    }

    await removeDocumentPhoto(id)
    setPhotos((current) => current.filter((photo) => photo.id !== id))
  }

  async function handleReview(photoCountOverride?: number) {
    if (analyzing) return

    const photoCount = photoCountOverride ?? photos.length
    if (photoCount === 0) {
      setError('Bitte fotografiere mindestens ein Dokument.')
      return
    }

    const name = (activeCase?.userName || profileName).trim()
    if (!name || !activeCase) {
      router.push('/')
      return
    }

    setError('')
    setAnalyzing(true)

    try {
      const result = await analyzeCurrentPhotos({ intent })

      await saveCaseFileContent(activeCase.id, result.caseFileContent)
      await saveLatestReview(activeCase.id, {
        ...result,
        analyzedAt: Date.now(),
        intent,
        photoCount,
      })

      await clearDocumentPhotos(activeCase.id)

      for (const photo of photos) {
        URL.revokeObjectURL(photo.previewUrl)
      }
      discardPending()
      setPhotos([])

      router.push('/pruefen')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Prüfung fehlgeschlagen.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleAcceptAndNext() {
    if (!pendingPhoto || analyzing || busy) return

    const result = await commitPendingPhoto()
    if (!result) return

    if (result.totalCount >= maxPhotos) {
      setError(`Maximal ${maxPhotos} Fotos erreicht. Du kannst jetzt abschließen.`)
      return
    }

    triggerCameraInput(inputRef.current)
  }

  async function handleAcceptAndFinish() {
    if (!pendingPhoto || analyzing || busy) return

    const result = await commitPendingPhoto()
    if (!result) return

    await handleReview(result.totalCount)
  }

  function handleDiscardAndRetake() {
    if (analyzing || busy) return
    discardPending()
    triggerCameraInput(inputRef.current)
  }

  function handleDiscardAndBack() {
    if (analyzing || busy) return
    discardPending()
    router.back()
  }

  const canAddMore = photos.length < maxPhotos && !inPreview
  const isInteractionLocked = loading || busy || analyzing
  const previewPhotoNumber = photos.length + 1

  return (
    <>
      {analyzing ? <AnalyzingOverlay /> : null}

      <OnboardingShell
        title={inPreview ? 'Foto prüfen' : copy.title}
        subtitle={activeCase ? activeCase.title : profileName ? `Hallo ${profileName}` : 'Behördenpost'}
        footer={
          inPreview ? (
            <div className="space-y-2">
              {canTakeNextAfterAccept ? (
                <>
                  <PrimaryButton inactive={isInteractionLocked} onClick={() => void handleAcceptAndNext()}>
                    Foto verwenden + nächstes Foto
                  </PrimaryButton>
                  <button
                    type="button"
                    disabled={isInteractionLocked}
                    onClick={() => void handleAcceptAndFinish()}
                    className="flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground transition-colors hover:border-accent disabled:opacity-50"
                  >
                    Foto verwenden + abschließen
                  </button>
                </>
              ) : (
                <PrimaryButton inactive={isInteractionLocked} onClick={() => void handleAcceptAndFinish()}>
                  Foto verwenden + abschließen
                </PrimaryButton>
              )}
              <button
                type="button"
                disabled={isInteractionLocked}
                onClick={handleDiscardAndRetake}
                className="flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground transition-colors hover:border-accent disabled:opacity-50"
              >
                Verwerfen + neues Foto
              </button>
              <button
                type="button"
                disabled={isInteractionLocked}
                onClick={handleDiscardAndBack}
                className="flex h-12 w-full items-center justify-center text-sm font-medium text-muted disabled:opacity-50"
              >
                Verwerfen + zurück
              </button>
            </div>
          ) : (
            <PrimaryButton
              inactive={isInteractionLocked || photos.length === 0}
              onClick={() => void handleReview()}
            >
              Prüfen
            </PrimaryButton>
          )
        }
      >
        <section className="flex flex-1 flex-col gap-6">
          {inPreview && pendingPhoto ? (
            <>
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-tight">Passt das Foto?</h2>
                <p className="leading-7 text-muted">
                  Foto {previewPhotoNumber} von {maxPhotos}. Prüfe, ob alles lesbar ist — danach kannst du
                  weitermachen oder abschließen.
                </p>
              </div>

              <figure className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                <Image
                  src={pendingPhoto.previewUrl}
                  alt="Aufgenommenes Dokumentfoto"
                  width={480}
                  height={640}
                  unoptimized
                  className="aspect-[3/4] w-full object-cover"
                />
              </figure>

              {photos.length > 0 ? (
                <p className="text-sm text-muted">
                  {photos.length} Foto{photos.length === 1 ? '' : 's'} bereits übernommen.
                </p>
              ) : null}
            </>
          ) : (
            <>
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-tight">{copy.heading}</h2>
                <p className="leading-7 text-muted">{copy.hint}</p>
              </div>

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
                        className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white"
                      >
                        Entfernen
                      </button>
                    ) : null}
                  </figure>
                ))}

                {canAddMore && !analyzing ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                    className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-3 text-center text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
                  >
                    <span className="text-3xl leading-none">+</span>
                    <span>{photos.length === 0 ? 'Foto aufnehmen' : 'Weiteres Foto'}</span>
                  </button>
                ) : null}
              </div>

              <p className="text-sm text-muted">
                {photos.length} von {maxPhotos} Fotos
                {photos.length === 0 ? ' — mindestens 1 Foto für die Prüfung nötig.' : ''}
              </p>

              {photos.length > 0 ? (
                <Link
                  href="/pruefen"
                  className="text-sm font-medium text-muted underline-offset-4 hover:text-accent hover:underline"
                >
                  Zurück zur Auswertung
                </Link>
              ) : null}
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handlePhotoSelected(event)}
          />

          {error ? (
            <p className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          ) : null}
        </section>
      </OnboardingShell>
    </>
  )
}
