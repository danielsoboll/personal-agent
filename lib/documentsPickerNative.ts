import { Capacitor, WebPlugin, registerPlugin } from '@capacitor/core'

export type NativePickedFile = {
  name: string
  mimeType: string
  base64: string
  size: number
}

export type DocumentsPickerPlugin = {
  isAvailable: () => Promise<{ available: boolean }>
  pickDocuments: (options?: { multiple?: boolean }) => Promise<{ files: NativePickedFile[] }>
}

class DocumentsPickerWeb extends WebPlugin implements DocumentsPickerPlugin {
  async isAvailable(): Promise<{ available: boolean }> {
    return { available: false }
  }

  async pickDocuments(): Promise<{ files: NativePickedFile[] }> {
    throw Object.assign(new Error('NATIVE_UNAVAILABLE'), { code: 'NATIVE_UNAVAILABLE' })
  }
}

const DocumentsPicker = registerPlugin<DocumentsPickerPlugin>('DocumentsPicker', {
  web: () => new DocumentsPickerWeb(),
})

/** Native iOS-Hülle mit DocumentsPickerPlugin. */
export function canUseNativeDocumentsPicker(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
}

function base64ToFile(base64: string, name: string, mimeType: string): File {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], name, { type: mimeType || 'application/octet-stream' })
}

/**
 * Native: öffnet Dateien möglichst in iCloud Drive → Dokumente.
 * `null` = abgebrochen.
 */
export async function pickDocumentsNative(multiple = true): Promise<File[] | null> {
  try {
    const result = await DocumentsPicker.pickDocuments({ multiple })
    return result.files.map((file) => base64ToFile(file.base64, file.name, file.mimeType))
  } catch (caught) {
    const code =
      caught && typeof caught === 'object' && 'code' in caught
        ? String((caught as { code?: string }).code)
        : ''
    const message = caught instanceof Error ? caught.message : String(caught)
    if (code === 'USER_CANCELED' || message.toLowerCase().includes('abgebrochen')) {
      return null
    }
    throw caught instanceof Error ? caught : new Error(message)
  }
}
