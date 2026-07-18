/** Fotos aus der Mediathek — ohne Kamera (`capture`). */
export const GALLERY_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

/**
 * Fallback für <input type="file">: PDF öffnet die Dateien-App ohne Kamera.
 */
export const DOCUMENT_FILE_ACCEPT = 'application/pdf,.pdf'

export type DocumentPickSource = 'downloads' | 'documents' | 'browse'

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

const DOCUMENT_ACCEPT_TYPES = [
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
] as const

/**
 * Dateien wählen.
 * - downloads / documents: Chromium startet im Ordner, sonst Fallback-Input
 * - browse: immer klassisches Durchsuchen
 * `null` = abgebrochen, `'fallback'` = Input nutzen
 */
export async function pickDocuments(options?: {
  multiple?: boolean
  source?: DocumentPickSource
}): Promise<File[] | 'fallback' | null> {
  const source = options?.source ?? 'downloads'
  if (source === 'browse') return 'fallback'

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
      types: [...DOCUMENT_ACCEPT_TYPES],
    })

    return Promise.all(handles.map((handle) => handle.getFile()))
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === 'AbortError') {
      return null
    }
    return 'fallback'
  }
}
