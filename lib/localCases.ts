import type { AnalyzeResult } from '@/lib/analyzeTypes'
import { CASE_FILE_FORMAT, normalizeCaseFileJsonl, validateCaseFileJsonl } from '@/lib/caseFileJsonl'
import { LOCAL_STORES, runLocalTransaction } from '@/lib/localDb'
import { getStoredProfileName } from '@/lib/localProfile'

export const ACTIVE_CASE_ID_KEY = 'behoerdenpost.activeCaseId'
export const LEGACY_MIGRATION_KEY = 'behoerdenpost.migrated.v3'

export type StoredCase = {
  id: string
  title: string
  userName: string
  caseFileContent: string | null
  format: typeof CASE_FILE_FORMAT | null
  latestReview: AnalyzeResult | null
  createdAt: number
  updatedAt: number
}

export type CaseSummary = Pick<
  StoredCase,
  'id' | 'title' | 'userName' | 'createdAt' | 'updatedAt' | 'latestReview'
>

type LegacyCaseFile = {
  id: 'main'
  content: string
  format?: typeof CASE_FILE_FORMAT
  updatedAt: number
}

type LegacyReview = AnalyzeResult & {
  id: 'main'
}

export function getActiveCaseId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACTIVE_CASE_ID_KEY)
}

export function setActiveCaseId(caseId: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACTIVE_CASE_ID_KEY, caseId)
}

export function clearActiveCaseId(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ACTIVE_CASE_ID_KEY)
}

export async function listCases(): Promise<CaseSummary[]> {
  await migrateLegacySingleCaseIfNeeded()

  const cases = await runLocalTransaction<StoredCase[]>(LOCAL_STORES.cases, 'readonly', (store) =>
    store.getAll(),
  )

  return cases
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(({ id, title, userName, createdAt, updatedAt, latestReview }) => ({
      id,
      title,
      userName,
      createdAt,
      updatedAt,
      latestReview,
    }))
}

export async function getCase(caseId: string): Promise<StoredCase | null> {
  await migrateLegacySingleCaseIfNeeded()
  const record = await runLocalTransaction<StoredCase | undefined>(LOCAL_STORES.cases, 'readonly', (store) =>
    store.get(caseId),
  )
  return record ?? null
}

export async function getActiveCase(): Promise<StoredCase | null> {
  const activeCaseId = getActiveCaseId()
  if (!activeCaseId) return null
  return getCase(activeCaseId)
}

export async function createCase(title: string, userName: string): Promise<StoredCase> {
  const trimmedTitle = title.trim()
  const trimmedUserName = userName.trim()

  if (!trimmedTitle) throw new Error('Bitte gib einen Fallnamen ein.')
  if (!trimmedUserName) throw new Error('Bitte gib deinen Namen ein.')

  const now = Date.now()
  const record: StoredCase = {
    id: crypto.randomUUID(),
    title: trimmedTitle,
    userName: trimmedUserName,
    caseFileContent: null,
    format: null,
    latestReview: null,
    createdAt: now,
    updatedAt: now,
  }

  await runLocalTransaction(LOCAL_STORES.cases, 'readwrite', (store) => store.add(record))
  setActiveCaseId(record.id)
  return record
}

export async function saveCaseFileContent(caseId: string, content: string): Promise<void> {
  const existing = await getCase(caseId)
  if (!existing) throw new Error('Fall nicht gefunden.')

  const normalized = normalizeCaseFileJsonl(content)
  const validationError = validateCaseFileJsonl(normalized)
  if (validationError) throw new Error(validationError)

  const updated: StoredCase = {
    ...existing,
    caseFileContent: normalized,
    format: CASE_FILE_FORMAT,
    updatedAt: Date.now(),
  }

  await runLocalTransaction(LOCAL_STORES.cases, 'readwrite', (store) => store.put(updated))
}

export async function saveLatestReview(caseId: string, review: AnalyzeResult): Promise<void> {
  const existing = await getCase(caseId)
  if (!existing) throw new Error('Fall nicht gefunden.')

  const updated: StoredCase = {
    ...existing,
    latestReview: review,
    updatedAt: Date.now(),
  }

  await runLocalTransaction(LOCAL_STORES.cases, 'readwrite', (store) => store.put(updated))
}

export async function getCaseFileContent(caseId: string): Promise<string | null> {
  const record = await getCase(caseId)
  return record?.caseFileContent ?? null
}

export async function getLatestReview(caseId?: string): Promise<AnalyzeResult | null> {
  const id = caseId ?? getActiveCaseId()
  if (!id) return null
  const record = await getCase(id)
  return record?.latestReview ?? null
}

async function migrateLegacySingleCaseIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return
  if (window.localStorage.getItem(LEGACY_MIGRATION_KEY)) return

  const existingCases = await runLocalTransaction<StoredCase[]>(LOCAL_STORES.cases, 'readonly', (store) =>
    store.getAll(),
  )
  if (existingCases.length > 0) {
    window.localStorage.setItem(LEGACY_MIGRATION_KEY, '1')
    return
  }

  const legacyCase = await runLocalTransaction<LegacyCaseFile | undefined>(
    LOCAL_STORES.caseFile,
    'readonly',
    (store) => store.get('main'),
  )
  const legacyReview = await runLocalTransaction<LegacyReview | undefined>(
    LOCAL_STORES.review,
    'readonly',
    (store) => store.get('main'),
  )

  if (!legacyCase?.content && !legacyReview) {
    window.localStorage.setItem(LEGACY_MIGRATION_KEY, '1')
    return
  }

  const now = Date.now()
  const migrated: StoredCase = {
    id: crypto.randomUUID(),
    title: 'Mein Fall',
    userName: getStoredProfileName() || 'Nutzer',
    caseFileContent: legacyCase?.content ?? null,
    format: legacyCase?.content ? CASE_FILE_FORMAT : null,
    latestReview: legacyReview ? stripReviewId(legacyReview) : null,
    createdAt: legacyCase?.updatedAt ?? legacyReview?.analyzedAt ?? now,
    updatedAt: legacyCase?.updatedAt ?? legacyReview?.analyzedAt ?? now,
  }

  await runLocalTransaction(LOCAL_STORES.cases, 'readwrite', (store) => store.add(migrated))
  setActiveCaseId(migrated.id)
  window.localStorage.setItem(LEGACY_MIGRATION_KEY, '1')
}

function stripReviewId(review: LegacyReview): AnalyzeResult {
  const { id: _id, ...rest } = review
  return rest
}
