import { clearDraftCaseTitle } from '@/lib/draftCase'
import { PLUS_DISCOVER_UNLOCK_CHANGED_EVENT } from '@/lib/plusEngagement'
import {
  ACTIVE_CASE_ID_KEY,
  CASE_NUMBERS_MIGRATION_KEY,
  LEGACY_MIGRATION_KEY,
  clearActiveCaseId,
} from '@/lib/localCases'
import { LOCAL_STORES, type LocalStoreName, runLocalTransaction } from '@/lib/localDb'
import { clearStoredProfileName } from '@/lib/localProfile'

async function clearStore(storeName: LocalStoreName): Promise<void> {
  await runLocalTransaction(storeName, 'readwrite', (store) => store.clear())
}

const PLUS_ENGAGEMENT_KEY = 'behoerdenpost.plusEngagement.v1'
const PLUS_ACTIVE_KEY = 'behoerdenpost.plus.active.v1'

/** Entfernt alle lokalen App-Daten vom Gerät (Fälle, Fotos, Bibliothek, Profil). */
export async function deleteAllLocalData(): Promise<void> {
  await clearStore(LOCAL_STORES.photos)
  await clearStore(LOCAL_STORES.cases)
  await clearStore(LOCAL_STORES.library)
  await clearStore(LOCAL_STORES.caseFile)
  await clearStore(LOCAL_STORES.review)

  clearActiveCaseId()
  clearDraftCaseTitle()
  clearStoredProfileName()

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(LEGACY_MIGRATION_KEY)
    window.localStorage.removeItem(CASE_NUMBERS_MIGRATION_KEY)
    window.localStorage.removeItem(ACTIVE_CASE_ID_KEY)
    window.localStorage.removeItem(PLUS_ENGAGEMENT_KEY)
    window.localStorage.removeItem(PLUS_ACTIVE_KEY)
    const keysToRemove: string[] = []
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (!key) continue
      if (
        key.startsWith('behoerdenpost.steps-done.') ||
        key.startsWith('behoerdenpost-pwa') ||
        key.startsWith('behoerdenpost-home-screen')
      ) {
        keysToRemove.push(key)
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key)
    }
    window.dispatchEvent(new CustomEvent(PLUS_DISCOVER_UNLOCK_CHANGED_EVENT))
  }
}
