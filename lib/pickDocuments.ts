/** Fotos aus der Mediathek — ohne `capture`. */
export const GALLERY_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

/** Dateien-App auf iPhone: nur PDF — ohne Fotomediathek / Kamera. */
export const DOCUMENT_FILE_ACCEPT = 'application/pdf,.pdf'

/** Android/Desktop: Dateien inkl. Bilder — ohne `capture`. */
export const DOCUMENT_UPLOAD_ACCEPT =
  'application/pdf,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

export type DocumentPickSource = 'downloads' | 'documents' | 'gallery'

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

export function isAppleTouchDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

export function hasFolderFilePicker(): boolean {
  if (typeof window === 'undefined') return false
  return typeof (window as OpenFilePickerWindow).showOpenFilePicker === 'function'
}

/** Accept für den Fallback-<input>, wenn kein Ordner-Picker greift. */
export function documentFallbackAccept(source: DocumentPickSource): string {
  if (source === 'gallery') return GALLERY_ACCEPT
  // iPhone: PDF-only vermeidet Kamera im Dateien-Dialog; Bilder über Fotomediathek
  if (isAppleTouchDevice()) return DOCUMENT_FILE_ACCEPT
  return DOCUMENT_UPLOAD_ACCEPT
}

export type FolderPickHint = {
  folderLabel: string
  steps: string
}

/**
 * Kurzanleitung wenn der Browser keinen Startordner setzen kann (v. a. iPhone).
 */
export function getFolderPickHint(source: DocumentPickSource): FolderPickHint | null {
  if (source === 'gallery') return null

  if (source === 'downloads') {
    return {
      folderLabel: 'Downloads',
      steps: isAppleTouchDevice()
        ? 'Als Nächstes öffnet sich Dateien. Tippe dort auf „Downloads“.'
        : 'Als Nächstes den Ordner „Downloads“ öffnen.',
    }
  }

  return {
    folderLabel: 'Dateien',
    steps: isAppleTouchDevice()
      ? 'Als Nächstes öffnet sich Dateien. Tippe auf „Auf meinem iPhone“ (oder „Dokumente“).'
      : 'Als Nächstes den Ordner „Dokumente“ bzw. „Dateien“ öffnen.',
  }
}

/**
 * Dateien wählen.
 * - Android/Chrome: startIn öffnet Downloads bzw. Dateien direkt
 * - iPhone: kein Ordner-Start möglich → 'fallback' (+ Hinweis in der UI)
 * - gallery: immer Mediathek-Input
 */
export async function pickDocuments(options?: {
  multiple?: boolean
  source?: DocumentPickSource
}): Promise<File[] | 'fallback' | null> {
  const source = options?.source ?? 'downloads'

  if (source === 'gallery') return 'fallback'

  const picker = (window as OpenFilePickerWindow).showOpenFilePicker
  if (!picker || isAppleTouchDevice()) return 'fallback'

  const startIn = source === 'documents' ? 'documents' : 'downloads'
  const id = source === 'documents' ? 'behoerdenpost-dateien' : 'behoerdenpost-downloads'

  try {
    const handles = await picker({
      multiple: options?.multiple ?? true,
      excludeAcceptAllOption: false,
      startIn,
      id,
      types: FOLDER_ACCEPT_TYPES,
    })

    return Promise.all(handles.map((handle) => handle.getFile()))
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === 'AbortError') {
      return null
    }
    return 'fallback'
  }
}
