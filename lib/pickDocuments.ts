/** Fotos aus der Mediathek — ohne Kamera (`capture`). */
export const GALLERY_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

/**
 * Fallback für <input type="file">: PDF — öffnet die Dateien-App
 * (Durchsuchen → Downloads), ohne Kamera.
 */
export const DOCUMENT_FILE_ACCEPT = 'application/pdf,.pdf'

type OpenFilePickerOptions = {
  multiple?: boolean
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
  excludeAcceptAllOption?: boolean
  /** Chromium: Desktop, Documents, Downloads, … */
  startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
  /** Merkt sich den letzten Ordner pro ID */
  id?: string
}

type OpenFilePickerWindow = Window & {
  showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>
}

export function canPickFromDownloads(): boolean {
  return typeof window !== 'undefined' && typeof (window as OpenFilePickerWindow).showOpenFilePicker === 'function'
}

/**
 * Dateien wählen — bevorzugt Downloads mit Ordner-Navigation (Chromium).
 * `null` = abgebrochen, `'fallback'` = klassisches Datei-Input nutzen.
 */
export async function pickDocumentsFromDownloads(options?: {
  multiple?: boolean
}): Promise<File[] | 'fallback' | null> {
  const picker = (window as OpenFilePickerWindow).showOpenFilePicker
  if (!picker) return 'fallback'

  try {
    const handles = await picker({
      multiple: options?.multiple ?? true,
      excludeAcceptAllOption: false,
      startIn: 'downloads',
      id: 'behoerdenpost-dokumente',
      types: [
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
      ],
    })

    return Promise.all(handles.map((handle) => handle.getFile()))
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === 'AbortError') {
      return null
    }
    return 'fallback'
  }
}
