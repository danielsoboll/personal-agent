'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'

import AnalyzingOverlay from '@/components/AnalyzingOverlay'
import OnboardingShell, { PrimaryButton, PrivacyNote } from '@/components/onboarding/OnboardingShell'
import { analyzeCurrentPhotos } from '@/lib/analyzeClient'
import type { AnalyzeRound } from '@/lib/analyzeTypes'
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

export default function ScanClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [activeCase, setActiveCase] = useState<StoredCase | null>(null)
  const [profileName, setProfileName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const round: AnalyzeRound = searchParams.get('mode') === 'followup' ? 'followup' : 'initial'
  const maxPhotos = round === 'followup' ? MAX_FOLLOWUP_PHOTOS : MAX_INITIAL_PHOTOS

  const copy = useMemo(() => {
    if (round === 'followup') {
      return {
        title: 'Weitere Unterlagen fotografieren',
        heading: 'Fotografiere die angeforderten Unterlagen',
        hint: `Du kannst bis zu ${MAX_FOLLOWUP_PHOTOS} weitere Fotos aufnehmen — am besten neueste Schriftstücke zuerst.`,
      }
    }

    return {
      title: 'Dokument fotografieren',
      heading: 'Fotografiere das Dokument, den Antrag oder die E-Mail',
      hint: `Du kannst bis zu ${MAX_INITIAL_PHOTOS} Fotos aufnehmen — zum Beispiel Vorder- und Rückseite oder mehrere Seiten.`,
    }
  }, [round])

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

  async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || analyzing) return

    setError('')
    setBusy(true)

    try {
      const saved = await addDocumentPhoto(file, maxPhotos)
      const previewUrl = createPhotoPreviewUrl(saved.blob)
      setPhotos((current) => [...current, { ...saved, previewUrl }])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Foto konnte nicht gespeichert werden.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemovePhoto(id: string) {
    if (analyzing) return

    const target = photos.find((photo) => photo.id === id)
    if (target) {
      URL.revokeObjectURL(target.previewUrl)
    }

    await removeDocumentPhoto(id)
    setPhotos((current) => current.filter((photo) => photo.id !== id))
  }

  async function handleReview() {
    if (analyzing) return

    if (photos.length === 0) {
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
      const result = await analyzeCurrentPhotos({ round })
      const photoCount = photos.length

      await saveCaseFileContent(activeCase.id, result.caseFileContent)
      await saveLatestReview(activeCase.id, {
        ...result,
        analyzedAt: Date.now(),
        round,
        photoCount,
      })

      await clearDocumentPhotos(activeCase.id)

      for (const photo of photos) {
        URL.revokeObjectURL(photo.previewUrl)
      }
      setPhotos([])

      router.push('/pruefen')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Prüfung fehlgeschlagen.')
    } finally {
      setAnalyzing(false)
    }
  }

  const canAddMore = photos.length < maxPhotos
  const isInteractionLocked = loading || busy || analyzing

  return (
    <>
      {analyzing ? <AnalyzingOverlay /> : null}

      <OnboardingShell
        title={copy.title}
        subtitle={activeCase ? activeCase.title : profileName ? `Hallo ${profileName}` : 'Behördenpost'}
        footer={
          <PrimaryButton
            disabled={isInteractionLocked || photos.length === 0}
            onClick={() => void handleReview()}
          >
            Prüfen
          </PrimaryButton>
        }
      >
        <section className="flex flex-1 flex-col gap-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">{copy.heading}</h2>
            <p className="leading-7 text-muted">{copy.hint}</p>
          </div>

          <PrivacyNote variant="analysis" />

          <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${analyzing ? 'pointer-events-none opacity-60' : ''}`}>
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

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handlePhotoSelected(event)}
          />

          <p className="text-sm text-muted">
            {photos.length} von {maxPhotos} Fotos
            {photos.length === 0 ? ' — mindestens 1 Foto für die Prüfung nötig.' : ''}
          </p>

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
