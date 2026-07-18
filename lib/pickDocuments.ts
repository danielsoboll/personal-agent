/** Fotos aus der Mediathek — ohne `capture` (Kamera bleibt die Foto-Kachel). */
export const GALLERY_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

/** System-Dialog: PDF + Bilder (iPhone-Menü / Android-Fallback). */
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

/**
 * Nur wenn der Browser wirklich in Downloads/Dateien springen kann.
 * iPhone/Safari: false → kein eigenes Menü, direkt System-Dialog.
 */
export function canOpenWellKnownFolders(): boolean {
  if (typeof window === 'undefined' || isAppleTouchDevice()) return false
  return typeof (window as OpenFilePickerWindow).showOpenFilePicker === 'function'
}

/**
 * Ordner-Picker (Android/Desktop-Chrome).
 * `null` = abgebrochen, `'fallback'` = System-Input.
 */
export async function pickDocuments(options?: {
  multiple?: boolean
  source?: Exclude<DocumentPickSource, 'gallery'>
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
