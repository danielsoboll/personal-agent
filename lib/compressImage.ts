const MAX_EDGE = 1600
const JPEG_QUALITY = 0.82

export async function compressImageForAnalysis(file: Blob): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new Error('Bildkomprimierung ist nur im Browser verfügbar.')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('Canvas konnte nicht erstellt werden.')
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  })

  if (!blob) {
    throw new Error('Bild konnte nicht komprimiert werden.')
  }

  return blob
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Datei konnte nicht gelesen werden.'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Datei konnte nicht gelesen werden.'))
    reader.readAsDataURL(blob)
  })
}
