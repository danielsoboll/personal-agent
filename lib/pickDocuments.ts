/** Fotos aus der Mediathek — ohne `capture` (Kamera bleibt die Foto-Kachel). */
export const GALLERY_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

/** System-Dialog: PDF + Bilder (Android/Desktop). */
export const DOCUMENT_UPLOAD_ACCEPT =
  'application/pdf,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

/**
 * iPhone: kein accept (oder nur ein Typ) — sonst greyt iOS PDFs aus,
 * sobald PDF und Bilder kombiniert werden (WebKit-Bug).
 * Filterung bleibt in prepareUploadFiles / validateUploadFile.
 */
export function systemUploadAccept(): string | undefined {
  if (isAppleTouchDevice()) return undefined
  return DOCUMENT_UPLOAD_ACCEPT
}

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
  const source = options?.source ?? 'documents'
  if (!canOpenWellKnownFolders()) return 'fallback'

  const picker = (window as OpenFilePickerWindow).showOpenFilePicker
  if (!picker) return 'fallback'

  const startIn = source === 'downloads' ? 'downloads' : 'documents'
  const id = source === 'downloads' ? 'behoerdenpost-downloads' : 'behoerdenpost-dokumente'

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
