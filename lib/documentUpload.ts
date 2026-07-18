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

const PDF_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-pdf',
  'application/acrobat',
  'application/vnd.adobe.pdf',
  'text/pdf',
])

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif)$/i
const PDF_EXTENSION = /\.pdf$/i

export function isPdfMimeType(mimeType: string): boolean {
  return PDF_MIME_TYPES.has(mimeType.toLowerCase())
}

export function isPdfFile(file: File): boolean {
  if (file.type && isPdfMimeType(file.type)) return true
  if (PDF_EXTENSION.test(file.name)) return true
  return false
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/') || IMAGE_TYPES.has(file.type)) return true
  if (!file.type || file.type === 'application/octet-stream' || file.type === 'application/x-octet-stream') {
    return IMAGE_EXTENSIONS.test(file.name)
  }
  return false
}

/** iOS Dateien: oft leerer MIME und Name ohne .pdf — Signatur %PDF prüfen. */
async function sniffPdf(file: File): Promise<boolean> {
  try {
    const header = new Uint8Array(await file.slice(0, 8).arrayBuffer())
    // %PDF
    return header.length >= 4 && header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46
  } catch {
    return false
  }
}

async function sniffImage(file: File): Promise<boolean> {
  try {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    if (header.length < 3) return false
    // JPEG
    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return true
    // PNG
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) return true
    // WEBP: RIFF....WEBP
    if (
      header.length >= 12 &&
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46 &&
      header[8] === 0x57 &&
      header[9] === 0x45 &&
      header[10] === 0x42 &&
      header[11] === 0x50
    ) {
      return true
    }
    // HEIC/HEIF: ....ftyp
    if (header.length >= 8 && header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
      return true
    }
    return false
  } catch {
    return false
  }
}

export function inferDocumentKind(mimeType: string, fileName?: string): DocumentKind {
  if (isPdfMimeType(mimeType)) return 'pdf'
  if (fileName && PDF_EXTENSION.test(fileName)) return 'pdf'
  return 'image'
}

/** Anzeigename ohne Technik-Endungen. */
export function displayDocumentLabel(fileName: string | undefined, kind: DocumentKind): string {
  const raw = fileName?.trim()
  if (!raw) return kind === 'pdf' ? 'Datei' : 'Foto'
  const withoutExt = raw.replace(/\.(pdf|jpe?g|png|webp|heic|heif)$/i, '').trim()
  return withoutExt || (kind === 'pdf' ? 'Datei' : 'Foto')
}

/** Sync-Validierung (ohne Signatur-Sniff). */
export function validateUploadFile(file: File): void {
  if (!isImageFile(file) && !isPdfFile(file)) {
    throw new Error('Bitte ein PDF oder Foto wählen (JPG, PNG, HEIC).')
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Die Datei ist zu gross (max. 20 MB).')
  }

  if (file.size === 0) {
    throw new Error('Die Datei ist leer — in Dateien ggf. erst öffnen, damit iCloud sie lädt.')
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
  const origin = window.location.origin
  pdfjs.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.mjs`

  const data = new Uint8Array(await blob.arrayBuffer())
  if (data.length < 5) {
    throw new Error('PDF ist leer oder noch nicht von iCloud geladen.')
  }

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
 * Erkennt PDFs auch ohne MIME/.pdf (iOS Dateien / iCloud).
 */
export async function prepareUploadFiles(file: File): Promise<PreparedUploadFile[]> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Die Datei ist zu gross (max. 20 MB).')
  }
  if (file.size === 0) {
    throw new Error('Die Datei ist leer — in Dateien ggf. erst öffnen, damit iCloud sie lädt.')
  }

  const treatAsPdf = isPdfFile(file) || (await sniffPdf(file))
  const treatAsImage = !treatAsPdf && (isImageFile(file) || (await sniffImage(file)))

  if (!treatAsPdf && !treatAsImage) {
    const hint = [file.name || 'ohne Namen', file.type || 'ohne Typ'].join(', ')
    throw new Error(`Bitte ein PDF oder Foto wählen (JPG, PNG, HEIC). (${hint})`)
  }

  if (treatAsPdf) {
    try {
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
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : 'Unbekannter Fehler'
      throw new Error(`PDF konnte nicht verarbeitet werden: ${detail}`)
    }
  }

  const mimeType = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg'
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
