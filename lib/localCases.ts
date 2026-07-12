import type { AnalyzeResult } from '@/lib/analyzeTypes'
import { CASE_FILE_FORMAT, prepareCaseFileContent, validateCaseFileJsonl } from '@/lib/caseFileJsonl'
import { createId } from '@/lib/createId'
import { LOCAL_STORES, runLocalTransaction } from '@/lib/localDb'
import { compareCasesForHome, resolveCaseStatus, type CaseStatusDisplay } from '@/lib/caseStatus'
import { listLibraryDocuments } from '@/lib/localLibrary'
import { getStoredProfileName } from '@/lib/localProfile'

export const ACTIVE_CASE_ID_KEY = 'behoerdenpost.activeCaseId'
export const LEGACY_MIGRATION_KEY = 'behoerdenpost.migrated.v3'
export const CASE_NUMBERS_MIGRATION_KEY = 'behoerdenpost.migrated.v4'

/** Vom Nutzer gesetzt oder null (= automatisch aus Verlauf). */
export type CaseUserStatus = 'aktiv' | 'laufend' | 'vorerst_erledigt'

export type StoredCase = {
  id: string
  caseNumber: number
  title: string
  userName: string
  userStatus: CaseUserStatus | null
  caseFileContent: string | null
  format: typeof CASE_FILE_FORMAT | null
  latestReview: AnalyzeResult | null
  createdAt: number
  updatedAt: number
}

export type CaseSummary = Pick<
  StoredCase,
  'id' | 'caseNumber' | 'title' | 'userStatus' | 'createdAt' | 'updatedAt' | 'latestReview'
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

export type CaseListItem = CaseSummary & {
  displayStatus: CaseStatusDisplay
  hasWordDocs: boolean
}

export async function listCases(): Promise<CaseSummary[]> {
  await migrateLegacySingleCaseIfNeeded()
  await migrateCaseNumbersIfNeeded()

  const cases = await runLocalTransaction<StoredCase[]>(LOCAL_STORES.cases, 'readonly', (store) =>
    store.getAll(),
  )

  return cases.map(({ id, caseNumber, title, userStatus, createdAt, updatedAt, latestReview }) => ({
    id,
    caseNumber,
    title,
    userStatus,
    createdAt,
    updatedAt,
    latestReview,
  }))
}

export async function listCasesForHome(): Promise<CaseListItem[]> {
  const cases = await listCases()
  const library = await listLibraryDocuments()
  const caseIdsWithDocs = new Set(library.map((doc) => doc.caseId))

  const items: CaseListItem[] = cases.map((caseItem) => {
    const hasWordDocs = caseIdsWithDocs.has(caseItem.id)
    const displayStatus = resolveCaseStatus({
      userStatus: caseItem.userStatus,
      hasWordDocs,
      latestReview: caseItem.latestReview,
    })
    return { ...caseItem, hasWordDocs, displayStatus }
  })

  return items.sort((a, b) =>
    compareCasesForHome(
      { caseNumber: a.caseNumber, display: a.displayStatus, updatedAt: a.updatedAt },
      { caseNumber: b.caseNumber, display: b.displayStatus, updatedAt: b.updatedAt },
    ),
  )
}

async function nextCaseNumber(): Promise<number> {
  const cases = await runLocalTransaction<StoredCase[]>(LOCAL_STORES.cases, 'readonly', (store) =>
    store.getAll(),
  )
  const max = cases.reduce((current, record) => Math.max(current, record.caseNumber ?? 0), 0)
  return max + 1
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
  if (!trimmedUserName) throw new Error('Bitte gib deinen Vornamen ein.')

  const now = Date.now()
  const record: StoredCase = {
    id: createId(),
    caseNumber: await nextCaseNumber(),
    title: trimmedTitle,
    userName: trimmedUserName,
    userStatus: null,
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

  const { content: normalized } = prepareCaseFileContent(content)
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

  const caseFileContent = review.caseFileContent?.trim()
    ? review.caseFileContent
    : existing.caseFileContent

  const updated: StoredCase = {
    ...existing,
    caseFileContent,
    format: caseFileContent ? CASE_FILE_FORMAT : existing.format,
    latestReview: review,
    updatedAt: Date.now(),
  }

  await runLocalTransaction(LOCAL_STORES.cases, 'readwrite', (store) => store.put(updated))
}

export async function updateCaseUserStatus(
  caseId: string,
  userStatus: CaseUserStatus | null,
): Promise<void> {
  const existing = await getCase(caseId)
  if (!existing) throw new Error('Fall nicht gefunden.')

  const updated: StoredCase = {
    ...existing,
    userStatus,
    updatedAt: Date.now(),
  }

  await runLocalTransaction(LOCAL_STORES.cases, 'readwrite', (store) => store.put(updated))
}

export async function toggleCaseDone(caseId: string): Promise<CaseUserStatus | null> {
  const existing = await getCase(caseId)
  if (!existing) throw new Error('Fall nicht gefunden.')

  const nextStatus: CaseUserStatus | null =
    existing.userStatus === 'vorerst_erledigt' ? null : 'vorerst_erledigt'

  await updateCaseUserStatus(caseId, nextStatus)
  return nextStatus
}

export async function removeCase(caseId: string): Promise<void> {
  const existing = await getCase(caseId)
  if (!existing) throw new Error('Fall nicht gefunden.')

  await runLocalTransaction(LOCAL_STORES.cases, 'readwrite', (store) => store.delete(caseId))

  if (getActiveCaseId() === caseId) {
    clearActiveCaseId()
  }
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
    id: createId(),
    caseNumber: 1,
    title: 'Mein Fall',
    userName: getStoredProfileName() || 'Nutzer',
    userStatus: null,
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

async function migrateCaseNumbersIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return
  if (window.localStorage.getItem(CASE_NUMBERS_MIGRATION_KEY)) return

  const cases = await runLocalTransaction<StoredCase[]>(LOCAL_STORES.cases, 'readonly', (store) =>
    store.getAll(),
  )

  const needsMigration = cases.some(
    (record) => typeof record.caseNumber !== 'number' || record.userStatus === undefined,
  )

  if (!needsMigration && cases.length > 0) {
    window.localStorage.setItem(CASE_NUMBERS_MIGRATION_KEY, '1')
    return
  }

  const sorted = [...cases].sort((a, b) => a.createdAt - b.createdAt)
  let counter = 0

  for (const record of sorted) {
    counter += 1
    const updated: StoredCase = {
      ...record,
      caseNumber: typeof record.caseNumber === 'number' ? record.caseNumber : counter,
      userStatus: record.userStatus ?? null,
    }
    await runLocalTransaction(LOCAL_STORES.cases, 'readwrite', (store) => store.put(updated))
  }

  window.localStorage.setItem(CASE_NUMBERS_MIGRATION_KEY, '1')
}
