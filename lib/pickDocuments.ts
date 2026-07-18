/** Fotos aus der Mediathek — ohne `capture` (Kamera bleibt die Foto-Kachel). */
export const GALLERY_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

/** Nur PDF → iOS öffnet Dateien ohne „Foto aufnehmen“ / Mediathek. */
export const DOCUMENT_FILE_ACCEPT = 'application/pdf,.pdf'

/** Android-Fallback: Dateien inkl. Bilder, ohne `capture`. */
export const DOCUMENT_UPLOAD_ACCEPT =
  'application/pdf,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

export type DocumentPickSource = 'downloads' | 'documents' | 'gallery' | 'file'

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

/** Chrome/Android: echte Startordner (Downloads / Dateien). Safari/iOS: nie. */
export function canOpenWellKnownFolders(): boolean {
  if (typeof window === 'undefined' || isAppleTouchDevice()) return false
  return typeof (window as OpenFilePickerWindow).showOpenFilePicker === 'function'
}

/**
 * Ordner-Picker (nur Android/Desktop-Chrome).
 * `null` = abgebrochen, `'fallback'` = klassisches Input nutzen.
 */
export async function pickDocuments(options?: {
  multiple?: boolean
  source?: Exclude<DocumentPickSource, 'gallery' | 'file'>
}): Promise<File[] | 'fallback' | null> {
  const source = options?.source ?? 'downloads'
  if (!canOpenWellKnownFolders()) return 'fallback'

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
