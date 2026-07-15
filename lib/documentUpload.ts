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

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || IMAGE_TYPES.has(file.type)
}

export function validateUploadFile(file: File): void {
  if (!isImageFile(file) && !isPdfFile(file)) {
    throw new Error('Bitte wähle ein Bild (JPG, PNG) oder eine PDF-Datei.')
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Die Datei ist zu gross (max. 20 MB).')
  }
}

async function pdfFileToImageBlobs(file: File): Promise<Blob[]> {
  if (typeof window === 'undefined') {
    throw new Error('PDF-Verarbeitung ist nur im Browser verfügbar.')
  }

  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

  const data = new Uint8Array(await file.arrayBuffer())
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

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.88)
    })

    if (!blob) {
      throw new Error(`PDF-Seite ${pageNumber} konnte nicht gelesen werden.`)
    }

    blobs.push(blob)
  }

  return blobs
}

/** Bild oder PDF → eine oder mehrere JPEG-Blobs für die Auswertung. */
export async function uploadFileToImageBlobs(file: File): Promise<Blob[]> {
  validateUploadFile(file)

  if (isPdfFile(file)) {
    const pages = await pdfFileToImageBlobs(file)
    if (pages.length === 0) {
      throw new Error('Die PDF-Datei enthält keine Seiten.')
    }
    return pages
  }

  return [file]
}
