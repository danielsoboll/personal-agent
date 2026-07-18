'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'

import AnalyzingOverlay from '@/components/AnalyzingOverlay'
import OnboardingShell, { PageIntro, PrivacyNote } from '@/components/onboarding/OnboardingShell'
import { buttonStyles, PRESSABLE_3D } from '@/lib/buttonStyles'
import { usePlusDiscoverHeader } from '@/hooks/usePlusDiscoverHeader'
import { analyzeCurrentPhotos, requestDocumentPeek } from '@/lib/analyzeClient'
import { logUserActivity } from '@/lib/activityLog'
import { scheduleCaseFileReorganizeAfterAnalyze } from '@/lib/caseFileReorganizeClient'
import type { AnalyzeIntent, DocumentPeekResult } from '@/lib/analyzeTypes'
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
import { prepareUploadFiles, displayDocumentLabel } from '@/lib/documentUpload'
import {
  canOpenWellKnownFolders,
  isAppleTouchDevice,
  pickDocuments,
  systemUploadAccept,
} from '@/lib/pickDocuments'
import {
  canUseNativeDocumentsPicker,
  pickDocumentsNative,
} from '@/lib/documentsPickerNative'
import { getStoredProfileName } from '@/lib/localProfile'

type PhotoPreview = StoredPhoto & {
  previewUrl: string | null
}

function truncateFileName(name: string, max = 28): string {
  if (name.length <= max) return name
  return `${name.slice(0, max - 1)}…`
}

function parseIntent(value: string | null): AnalyzeIntent {
  if (value === 'current_more' || value === 'historical') return value
  return 'initial'
}

/**
 * Nicht `display:none` / `.hidden` — iOS öffnet sonst oft den kaputten
 * Such-Dialog statt Dateien → iCloud Drive → Dokumente.
 */
const FILE_INPUT_CLIPPED =
  'pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden opacity-0'

const UPLOAD_INPUT_ID = 'behoerdenpost-scan-upload'

/** Sofort klicken — setTimeout bricht auf iOS die User-Geste. */
function openFileInput(input: HTMLInputElement | null) {
  input?.click()
}

const PEEK_WAIT_MS = 12_000

export default function ScanClient() {
  const router = useRouter()
  const plus = usePlusDiscoverHeader()
  const searchParams = useSearchParams()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const peekRequestIdRef = useRef(0)
  const peekPromiseRef = useRef<Promise<DocumentPeekResult | null> | null>(null)
  const [photos, setPhotos] = useState<PhotoPreview[]>([])
  const [activeCase, setActiveCase] = useState<StoredCase | null>(null)
  const [profileName, setProfileName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [peekResult, setPeekResult] = useState<DocumentPeekResult | null>(null)
  const [peekBusy, setPeekBusy] = useState(false)
  const [peekPhotoId, setPeekPhotoId] = useState<string | null>(null)
  const [folderPickerAvailable, setFolderPickerAvailable] = useState(false)
  /** Start ohne accept — erst nach Mount setzen (iPhone: weiter ohne accept). */
  const [uploadAccept, setUploadAccept] = useState<string | undefined>(undefined)
  const [showIcloudHint, setShowIcloudHint] = useState(false)
  const [nativeDocumentsPicker, setNativeDocumentsPicker] = useState(false)

  const intent = parseIntent(searchParams.get('intent'))
  const maxPhotos = intent === 'initial' ? MAX_INITIAL_PHOTOS : MAX_FOLLOWUP_PHOTOS
  const canAddMore = photos.length < maxPhotos

  useEffect(() => {
    const native = canUseNativeDocumentsPicker()
    setFolderPickerAvailable(canOpenWellKnownFolders())
    setUploadAccept(systemUploadAccept())
    setNativeDocumentsPicker(native)
    setShowIcloudHint(isAppleTouchDevice() && !native)
  }, [])

  const copy = useMemo(() => {
    if (intent === 'current_more') {
      return {
        title: 'Weitere Fotos zum aktuellen Schreiben',
        heading: 'Ergänze das aktuelle Schreiben',
        hint: `Bis zu ${MAX_FOLLOWUP_PHOTOS} Dokumente — Foto oder Datei.`,
      }
    }

    if (intent === 'historical') {
      return {
        title: 'Ältere Dokumente erfassen',
        heading: 'Ältere Unterlagen für den Hintergrund',
        hint: `Bis zu ${MAX_FOLLOWUP_PHOTOS} Dokumente — Foto oder Datei.`,
      }
    }

    return {
      title: 'Dokument erfassen',
      heading: 'Fotografiere oder lade dein Dokument hoch',
      hint: `Bis zu ${MAX_INITIAL_PHOTOS} Dokumente — Foto aufnehmen oder Dokument hochladen.`,
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
          previewUrl: photo.kind === 'pdf' ? null : createPhotoPreviewUrl(photo.blob),
        })),
      )
      setLoading(false)
    }

    void loadPhotos()
  }, [router])

  useEffect(() => {
    return () => {
      for (const photo of photos) {
        if (photo.previewUrl) {
          URL.revokeObjectURL(photo.previewUrl)
        }
      }
    }
  }, [photos])

  function startDocumentPeek(photo: StoredPhoto) {
    if (!activeCase) return

    const requestId = peekRequestIdRef.current + 1
    peekRequestIdRef.current = requestId
    setPeekBusy(true)
    setPeekResult(null)
    setPeekPhotoId(photo.id)

    const promise = requestDocumentPeek({
      intent,
      photo: {
        blob: photo.blob,
        kind: photo.kind ?? 'image',
        fileName: photo.fileName,
      },
    })
      .then((result) => {
        if (peekRequestIdRef.current !== requestId) return null
        setPeekResult(result)
        return result
      })
      .catch(() => {
        if (peekRequestIdRef.current !== requestId) return null
        setPeekResult(null)
        return null
      })
      .finally(() => {
        if (peekRequestIdRef.current === requestId) {
          setPeekBusy(false)
        }
      })

    peekPromiseRef.current = promise
  }

  useEffect(() => {
    const first = photos[0]
    if (!first || !activeCase || loading) {
      if (photos.length === 0) {
        peekRequestIdRef.current += 1
        peekPromiseRef.current = null
        setPeekResult(null)
        setPeekBusy(false)
        setPeekPhotoId(null)
      }
      return
    }

    if (peekPhotoId === first.id && (peekResult || peekBusy)) return

    startDocumentPeek(first)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trigger only when first doc identity changes
  }, [photos[0]?.id, activeCase?.id, loading])

  async function waitForPeekContext(): Promise<DocumentPeekResult | undefined> {
    if (peekResult) return peekResult
    if (!peekPromiseRef.current) return undefined

    const raced = await Promise.race([
      peekPromiseRef.current,
      new Promise<null>((resolve) => {
        window.setTimeout(() => resolve(null), PEEK_WAIT_MS)
      }),
    ])

    return raced ?? peekResult ?? undefined
  }

  async function ingestFiles(files: File[]) {
    if (files.length === 0 || analyzing || busy) return

    setBusy(true)
    setError('')

    let added = 0
    let remaining = maxPhotos - photos.length
    const newPreviews: PhotoPreview[] = []

    try {
      for (const file of files) {
        if (remaining <= 0) {
          setError(`Maximal ${maxPhotos} Dokumente möglich — einige Dateien wurden nicht hinzugefügt.`)
          break
        }

        const preparedList = await prepareUploadFiles(file)
        for (const prepared of preparedList) {
          if (remaining <= 0) {
            setError(`Maximal ${maxPhotos} Dokumente möglich — einige Seiten wurden nicht hinzugefügt.`)
            break
          }

          const saved = await addDocumentPhoto(prepared.blob, maxPhotos, undefined, {
            fileName: prepared.fileName,
            mimeType: prepared.mimeType,
            kind: prepared.kind,
          })
          newPreviews.push({
            ...saved,
            previewUrl: createPhotoPreviewUrl(saved.blob),
          })
          added += 1
          remaining -= 1
        }
      }

      if (newPreviews.length > 0) {
        setPhotos((current) => [...current, ...newPreviews])
      }

      if (added > 0 && photos.length + added >= maxPhotos) {
        setError(`Maximal ${maxPhotos} Dokumente erreicht. Tippe auf Prüfen.`)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Datei konnte nicht verarbeitet werden.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCameraSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await ingestFiles([file])
  }

  /** Native iOS → Dokumente/iCloud. Android FSA → Dokumente. Sonst Dateien-Dialog. */
  function handleDocumentUpload() {
    if (analyzing || busy || !canAddMore) return

    if (nativeDocumentsPicker) {
      void (async () => {
        try {
          const files = await pickDocumentsNative(true)
          if (files === null || files.length === 0) return
          await ingestFiles(files)
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : 'Dokumente konnten nicht geöffnet werden.',
          )
        }
      })()
      return
    }

    if (!folderPickerAvailable) {
      openFileInput(uploadInputRef.current)
      return
    }

    void (async () => {
      const picked = await pickDocuments({ multiple: true, source: 'documents' })
      if (picked === null) return
      if (picked === 'fallback') {
        openFileInput(uploadInputRef.current)
        return
      }
      await ingestFiles(picked)
    })()
  }

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    await ingestFiles(files)
  }

  async function handleRemovePhoto(id: string) {
    if (analyzing || busy) return

    const target = photos.find((photo) => photo.id === id)
    if (target?.previewUrl) {
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
      const peekContext = await waitForPeekContext()
      const result = await analyzeCurrentPhotos({ intent, peekContext })
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
        had_peek: Boolean(peekContext?.suggestedQuestion || peekContext?.quickGuess),
      })

      peekRequestIdRef.current += 1
      peekPromiseRef.current = null
      setPeekResult(null)
      setPeekBusy(false)
      setPeekPhotoId(null)

      for (const photo of photos) {
        if (photo.previewUrl) {
          URL.revokeObjectURL(photo.previewUrl)
        }
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
                  onClick={() => openFileInput(cameraInputRef.current)}
                  className={buttonStyles.secondary}
                >
                  Neues Foto
                </button>
                {folderPickerAvailable || nativeDocumentsPicker ? (
                  <button
                    type="button"
                    disabled={isInteractionLocked}
                    onClick={handleDocumentUpload}
                    className={buttonStyles.secondary}
                  >
                    Dokument hochladen
                  </button>
                ) : (
                  <label
                    htmlFor={UPLOAD_INPUT_ID}
                    className={`${buttonStyles.secondary} ${isInteractionLocked ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                  >
                    Dokument hochladen
                  </label>
                )}
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
              Jetzt prüfen{photos.length > 0 ? ` (${photos.length} Dokument${photos.length === 1 ? '' : 'e'})` : ''}
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
              <button
                key={photo.id}
                type="button"
                disabled={isInteractionLocked}
                aria-label={`${photo.kind === 'pdf' ? 'Datei' : 'Foto'} ${index + 1} entfernen`}
                onClick={() => void handleRemovePhoto(photo.id)}
                className={`${PRESSABLE_3D} relative overflow-hidden rounded-2xl border border-border bg-surface text-left transition hover:border-red-300 hover:ring-2 hover:ring-red-200/80 disabled:opacity-60`}
              >
                {photo.kind === 'pdf' ? (
                  <div className="flex aspect-[3/4] flex-col items-center justify-center gap-3 px-3 py-6">
                    <span className="text-4xl leading-none" aria-hidden>
                      📄
                    </span>
                    <span className="line-clamp-4 text-center text-xs font-semibold leading-5 text-foreground">
                      {truncateFileName(displayDocumentLabel(photo.fileName, 'pdf'))}
                    </span>
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-accent">
                      Datei
                    </span>
                  </div>
                ) : (
                  <Image
                    src={photo.previewUrl!}
                    alt={`Dokumentfoto ${index + 1}`}
                    width={240}
                    height={320}
                    unoptimized
                    className="aspect-[3/4] h-full w-full object-cover"
                  />
                )}
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white">
                  {index + 1}
                </span>
                <span className="absolute inset-x-0 bottom-0 bg-black/70 py-2 text-center text-xs font-semibold text-white">
                  Entfernen
                </span>
              </button>
            ))}

            {photos.length === 0 && canAddMore ? (
              <>
                <button
                  type="button"
                  disabled={isInteractionLocked}
                  onClick={() => openFileInput(cameraInputRef.current)}
                  className={buttonStyles.photoCaptureTile}
                >
                  <span className="text-3xl leading-none" aria-hidden>
                    📷
                  </span>
                  <span>{busy ? 'Wird gespeichert …' : 'Foto aufnehmen'}</span>
                </button>
                {folderPickerAvailable || nativeDocumentsPicker ? (
                  <button
                    type="button"
                    disabled={isInteractionLocked}
                    onClick={handleDocumentUpload}
                    className={buttonStyles.photoCaptureTile}
                  >
                    <span className="text-3xl leading-none" aria-hidden>
                      📄
                    </span>
                    <span>{busy ? 'Wird verarbeitet …' : 'Dokument hochladen'}</span>
                  </button>
                ) : (
                  <label
                    htmlFor={UPLOAD_INPUT_ID}
                    className={`${buttonStyles.photoCaptureTile} ${isInteractionLocked ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                  >
                    <span className="text-3xl leading-none" aria-hidden>
                      📄
                    </span>
                    <span>{busy ? 'Wird verarbeitet …' : 'Dokument hochladen'}</span>
                  </label>
                )}
              </>
            ) : null}
          </div>

          {showIcloudHint && photos.length === 0 ? (
            <p className="text-center text-sm text-muted">
              In Dateien: <span className="font-medium text-foreground">iCloud Drive → Dokumente</span>
            </p>
          ) : null}

          {photos.length > 0 ? (
            <p className="text-sm text-muted">
              {photos.length} von {maxPhotos} Dokumenten — tippe zum Entfernen
            </p>
          ) : null}

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className={FILE_INPUT_CLIPPED}
            tabIndex={-1}
            onChange={(event) => void handleCameraSelected(event)}
          />

          <input
            id={UPLOAD_INPUT_ID}
            ref={uploadInputRef}
            type="file"
            {...(uploadAccept ? { accept: uploadAccept } : {})}
            multiple
            className={FILE_INPUT_CLIPPED}
            tabIndex={-1}
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
