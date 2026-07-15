export type DocumentKind = 'image' | 'pdf'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

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
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || IMAGE_TYPES.has(file.type)
}

export function inferDocumentKind(mimeType: string, fileName?: string): DocumentKind {
  if (isPdfMimeType(mimeType)) return 'pdf'
  if (fileName?.toLowerCase().endsWith('.pdf')) return 'pdf'
  return 'image'
}

export function validateUploadFile(file: File): void {
  if (!isImageFile(file) && !isPdfFile(file)) {
    throw new Error('Bitte wähle ein Bild (JPG, PNG) oder eine PDF-Datei.')
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Die Datei ist zu gross (max. 20 MB).')
  }
}

export type PreparedUploadFile = {
  blob: Blob
  fileName: string
  mimeType: string
  kind: DocumentKind
}

/** Datei validieren und als Blob für lokale Speicherung vorbereiten — PDFs bleiben PDF. */
export function prepareUploadFile(file: File): PreparedUploadFile {
  validateUploadFile(file)

  const mimeType = file.type || (isPdfFile(file) ? 'application/pdf' : 'image/jpeg')
  const kind = inferDocumentKind(mimeType, file.name)

  return {
    blob: file,
    fileName: file.name || (kind === 'pdf' ? 'Dokument.pdf' : 'Foto.jpg'),
    mimeType,
    kind,
  }
}
