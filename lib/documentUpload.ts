export type DocumentKind = 'image' | 'pdf'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const PDF_RENDER_SCALE = 1.75
const PDF_MAX_EDGE = 1600

export const UPLOAD_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.pdf'

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

export function isPdfMimeType(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

export function isPdfFile(file: File): boolean {
  if (file.type === 'application/pdf') return true
  if (file.name.toLowerCase().endsWith('.pdf')) return true
  // iOS liefert oft leeren oder generischen MIME-Typ
  if (!file.type || file.type === 'application/octet-stream') {
    return file.name.toLowerCase().endsWith('.pdf')
  }
  return false
}

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif)$/i

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/') || IMAGE_TYPES.has(file.type)) return true
  // iOS Dateien-App: oft type="" oder octet-stream trotz gültigem Foto
  if (!file.type || file.type === 'application/octet-stream' || file.type === 'application/x-octet-stream') {
    return IMAGE_EXTENSIONS.test(file.name)
  }
  return false
}

export function inferDocumentKind(mimeType: string, fileName?: string): DocumentKind {
  if (isPdfMimeType(mimeType)) return 'pdf'
  if (fileName?.toLowerCase().endsWith('.pdf')) return 'pdf'
  return 'image'
}

/** Anzeigename ohne Technik-Endungen. */
export function displayDocumentLabel(fileName: string | undefined, kind: DocumentKind): string {
  const raw = fileName?.trim()
  if (!raw) return kind === 'pdf' ? 'Datei' : 'Foto'
  const withoutExt = raw.replace(/\.(pdf|jpe?g|png|webp|heic|heif)$/i, '').trim()
  return withoutExt || (kind === 'pdf' ? 'Datei' : 'Foto')
}

export function validateUploadFile(file: File): void {
  if (!isImageFile(file) && !isPdfFile(file)) {
    throw new Error('Bitte wähle ein Foto oder eine Datei vom Schreiben.')
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Die Datei ist zu gross (max. 20 MB).')
  }

  if (file.size === 0) {
    throw new Error('Die Datei ist leer oder konnte nicht gelesen werden.')
  }
}

export type PreparedUploadFile = {
  blob: Blob
  fileName: string
  mimeType: string
  kind: DocumentKind
}

/** PDF-Seiten als JPEG rendern — zuverlässig für die Vision-Auswertung. */
export async function pdfBlobToImageBlobs(blob: Blob): Promise<Blob[]> {
  if (typeof window === 'undefined') {
    throw new Error('PDF-Verarbeitung ist nur im Browser verfügbar.')
  }

  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const data = new Uint8Array(await blob.arrayBuffer())
  const pdf = await pdfjs.getDocument({ data }).promise
  const blobs: Blob[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale: PDF_RENDER_SCALE })
    const scale = Math.min(1, PDF_MAX_EDGE / Math.max(viewport.width, viewport.height))
    const scaledViewport = page.getViewport({ scale: PDF_RENDER_SCALE * scale })

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(scaledViewport.width))
    canvas.height = Math.max(1, Math.round(scaledViewport.height))

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('PDF-Seite konnte nicht gerendert werden.')
    }

    await page.render({ canvasContext: context, viewport: scaledViewport }).promise

    const pageBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.88)
    })

    if (!pageBlob) {
      throw new Error(`PDF-Seite ${pageNumber} konnte nicht gelesen werden.`)
    }

    blobs.push(pageBlob)
  }

  return blobs
}

/**
 * Bild bleibt Bild; PDF wird seitenweise zu JPEG.
 * So geht die Auswertung über Vision — ohne kaputte PDF-File-Parts.
 */
export async function prepareUploadFiles(file: File): Promise<PreparedUploadFile[]> {
  validateUploadFile(file)

  if (isPdfFile(file)) {
    const pages = await pdfBlobToImageBlobs(file)
    if (pages.length === 0) {
      throw new Error('Die PDF-Datei enthält keine Seiten.')
    }

    const baseName = file.name.replace(/\.pdf$/i, '').trim() || 'Dokument'
    return pages.map((blob, index) => ({
      blob,
      fileName: pages.length === 1 ? `${baseName}.jpg` : `${baseName}-Seite-${index + 1}.jpg`,
      mimeType: 'image/jpeg',
      kind: 'image' as const,
    }))
  }

  const mimeType = file.type || 'image/jpeg'
  return [
    {
      blob: file,
      fileName: file.name || 'Foto.jpg',
      mimeType,
      kind: 'image',
    },
  ]
}

/** Sync-Hilfsfunktion für reine Bild-Metadaten (ohne PDF-Rendering). */
export function prepareUploadFile(file: File): PreparedUploadFile {
  validateUploadFile(file)

  if (isPdfFile(file)) {
    return {
      blob: file,
      fileName: file.name || 'Dokument.pdf',
      mimeType: 'application/pdf',
      kind: 'pdf',
    }
  }

  const mimeType = file.type || 'image/jpeg'
  return {
    blob: file,
    fileName: file.name || 'Foto.jpg',
    mimeType,
    kind: 'image',
  }
}
