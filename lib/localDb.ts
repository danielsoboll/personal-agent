const DB_NAME = 'behoerdenpost-local'
export const DB_VERSION = 5

export const LOCAL_STORES = {
  photos: 'document-photos',
  caseFile: 'case-file',
  review: 'latest-review',
  cases: 'cases',
  library: 'library',
  fallakteEvents: 'fallakte-events',
} as const

export type LocalStoreName = (typeof LOCAL_STORES)[keyof typeof LOCAL_STORES]

export function openLocalDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error ?? new Error('IndexedDB konnte nicht geöffnet werden.'))

    request.onupgradeneeded = (event) => {
      const db = request.result
      const oldVersion = event.oldVersion

      if (!db.objectStoreNames.contains(LOCAL_STORES.photos)) {
        db.createObjectStore(LOCAL_STORES.photos, { keyPath: 'id' })
      }

      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(LOCAL_STORES.caseFile)) {
          db.createObjectStore(LOCAL_STORES.caseFile, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(LOCAL_STORES.review)) {
          db.createObjectStore(LOCAL_STORES.review, { keyPath: 'id' })
        }
      }

      if (oldVersion < 3 && !db.objectStoreNames.contains(LOCAL_STORES.cases)) {
        db.createObjectStore(LOCAL_STORES.cases, { keyPath: 'id' })
      }

      if (oldVersion < 4 && !db.objectStoreNames.contains(LOCAL_STORES.library)) {
        db.createObjectStore(LOCAL_STORES.library, { keyPath: 'id' })
      }

      if (oldVersion < 5 && !db.objectStoreNames.contains(LOCAL_STORES.fallakteEvents)) {
        const store = db.createObjectStore(LOCAL_STORES.fallakteEvents, { keyPath: 'id' })
        store.createIndex('byCaseId', 'caseId', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
  })
}

export function runLocalTransaction<T>(
  storeName: LocalStoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openLocalDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode)
        const store = tx.objectStore(storeName)
        const request = fn(store)

        request.onerror = () => reject(request.error ?? new Error('IndexedDB-Anfrage fehlgeschlagen.'))
        request.onsuccess = () => resolve(request.result as T)
        tx.oncomplete = () => db.close()
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB-Transaktion fehlgeschlagen.'))
      }),
  )
}
