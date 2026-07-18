/** Fotos aus der Mediathek — ohne `capture`, damit nicht die Kamera forciert wird. */
export const GALLERY_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

/**
 * Dateien-App / Durchsuchen: nur PDF — auf iOS ohne Fotomediathek und ohne „Foto aufnehmen“.
 */
export const DOCUMENT_FILE_ACCEPT = 'application/pdf,.pdf'

/**
 * Android/Desktop: Dateien inkl. Bilder aus Ordnern — ohne `capture`.
 */
export const DOCUMENT_UPLOAD_ACCEPT =
  'application/pdf,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

export type DocumentPickSource = 'downloads' | 'documents' | 'browse' | 'gallery'

type OpenFilePickerOptions = {
  multiple?: boolean
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
  excludeAcceptAllOption?: boolean
  startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
  id?: string
}

type OpenFilePickerWindow = Window & {
  showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>
}

const FOLDER_ACCEPT_TYPES: Array<{
  description?: string
  accept: Record<string, string[]>
}> = [
  {
    description: 'Dokumente',
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/heic': ['.heic', '.heif'],
    },
  },
]

const PDF_ACCEPT_TYPES: Array<{
  description?: string
  accept: Record<string, string[]>
}> = [
  {
    description: 'PDF',
    accept: {
      'application/pdf': ['.pdf'],
    },
  },
]

/** iPhone/iPad: File System Access API fehlt. */
export function isAppleTouchDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/**
 * Accept für Datei-Suche / Ordner-Fallback.
 * iOS: nur PDF → Dateien-App ohne Kamera.
 * Android: PDF + Bilder aus dem Dateisystem.
 */
export function documentFallbackAccept(source: DocumentPickSource = 'browse'): string {
  if (source === 'gallery') return GALLERY_ACCEPT
  if (isAppleTouchDevice()) return DOCUMENT_FILE_ACCEPT
  return DOCUMENT_UPLOAD_ACCEPT
}

/**
 * Dateien wählen.
 * - downloads / documents: Chromium startet im Ordner
 * - browse: Durchsuchen (PDF/Dateien)
 * - gallery: immer Fallback-Input (Mediathek)
 * `null` = abgebrochen, `'fallback'` = Input nutzen
 */
export async function pickDocuments(options?: {
  multiple?: boolean
  source?: DocumentPickSource
}): Promise<File[] | 'fallback' | null> {
  const source = options?.source ?? 'downloads'

  if (source === 'gallery' || source === 'browse' || isAppleTouchDevice()) {
    return 'fallback'
  }

  const picker = (window as OpenFilePickerWindow).showOpenFilePicker
  if (!picker) return 'fallback'

  const startIn = source === 'documents' ? 'documents' : 'downloads'
  const id = source === 'documents' ? 'behoerdenpost-dateien' : 'behoerdenpost-downloads'

  try {
    const handles = await picker({
      multiple: options?.multiple ?? true,
      excludeAcceptAllOption: false,
      startIn,
      id,
      types: source === 'downloads' || source === 'documents' ? FOLDER_ACCEPT_TYPES : PDF_ACCEPT_TYPES,
    })

    return Promise.all(handles.map((handle) => handle.getFile()))
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === 'AbortError') {
      return null
    }
    return 'fallback'
  }
}
