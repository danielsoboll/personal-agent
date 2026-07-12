import { LOCAL_STORES, runLocalTransaction } from '@/lib/localDb'
import { getActiveCaseId } from '@/lib/localCases'

type StoredPhoto = {
  id: string
  caseId: string
  blob: Blob
  createdAt: number
}

export const MAX_INITIAL_PHOTOS = 8
export const MAX_FOLLOWUP_PHOTOS = 5

function requireActiveCaseId(): string {
  const caseId = getActiveCaseId()
  if (!caseId) throw new Error('Kein aktiver Fall ausgewählt.')
  return caseId
}

export async function listDocumentPhotos(caseId?: string): Promise<StoredPhoto[]> {
  const activeCaseId = caseId ?? requireActiveCaseId()
  const photos = await runLocalTransaction<StoredPhoto[]>(LOCAL_STORES.photos, 'readonly', (store) =>
    store.getAll(),
  )

  return photos
    .filter((photo) => photo.caseId === activeCaseId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

export async function addDocumentPhoto(blob: Blob, maxPhotos: number, caseId?: string): Promise<StoredPhoto> {
  const activeCaseId = caseId ?? requireActiveCaseId()
  const existing = await listDocumentPhotos(activeCaseId)

  if (existing.length >= maxPhotos) {
    throw new Error(`Maximal ${maxPhotos} Fotos möglich.`)
  }

  const photo: StoredPhoto = {
    id: crypto.randomUUID(),
    caseId: activeCaseId,
    blob,
    createdAt: Date.now(),
  }

  await runLocalTransaction<IDBValidKey>(LOCAL_STORES.photos, 'readwrite', (store) => store.add(photo))
  return photo
}

export async function removeDocumentPhoto(id: string): Promise<void> {
  await runLocalTransaction(LOCAL_STORES.photos, 'readwrite', (store) => store.delete(id))
}

export async function clearDocumentPhotos(caseId?: string): Promise<void> {
  const activeCaseId = caseId ?? requireActiveCaseId()
  const photos = await listDocumentPhotos(activeCaseId)

  await Promise.all(
    photos.map(
      (photo) =>
        new Promise<void>((resolve, reject) => {
          runLocalTransaction(LOCAL_STORES.photos, 'readwrite', (store) => store.delete(photo.id))
            .then(() => resolve())
            .catch(reject)
        }),
    ),
  )
}

export function createPhotoPreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

export type { StoredPhoto }
