import { isPlusEntitled } from '@/lib/plusEntitlement'

export const PLUS_BILLING_CHANGED_EVENT = 'behoerdenpost-plus-billing-changed'

const PLUS_BILLING_STATE_KEY = 'behoerdenpost.plusBilling.v2'
const LEGACY_PLUS_BILLING_STATE_KEY = 'behoerdenpost.plusBilling.v1'

export type PlusBillingState = {
  plan: 'free' | 'plus'
  /** Abgeleitet aus plan, plusUntil und subscriptionStatus — wie LifeXP isFamilyPlus. */
  active: boolean
  customerId: string | null
  subscriptionId: string | null
  subscriptionStatus: string | null
  plusUntil: string | null
  cancelAtPeriodEnd: boolean
  paymentStatus: string | null
  sessionStatus: string | null
  updatedAt: number
}

function emptyState(): PlusBillingState {
  return {
    plan: 'free',
    active: false,
    customerId: null,
    subscriptionId: null,
    subscriptionStatus: null,
    plusUntil: null,
    cancelAtPeriodEnd: false,
    paymentStatus: null,
    sessionStatus: null,
    updatedAt: 0,
  }
}

function withDerivedActive(state: Omit<PlusBillingState, 'active'>): PlusBillingState {
  return {
    ...state,
    active: isPlusEntitled(state),
  }
}

function normalizeParsed(parsed: Partial<PlusBillingState>): PlusBillingState {
  const base: Omit<PlusBillingState, 'active'> = {
    plan: parsed.plan === 'plus' ? 'plus' : parsed.active === true && !parsed.plan ? 'plus' : 'free',
    customerId: typeof parsed.customerId === 'string' ? parsed.customerId : null,
    subscriptionId: typeof parsed.subscriptionId === 'string' ? parsed.subscriptionId : null,
    subscriptionStatus:
      typeof parsed.subscriptionStatus === 'string' ? parsed.subscriptionStatus : null,
    plusUntil: typeof parsed.plusUntil === 'string' ? parsed.plusUntil : null,
    cancelAtPeriodEnd: parsed.cancelAtPeriodEnd === true,
    paymentStatus: typeof parsed.paymentStatus === 'string' ? parsed.paymentStatus : null,
    sessionStatus: typeof parsed.sessionStatus === 'string' ? parsed.sessionStatus : null,
    updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
  }

  return withDerivedActive(base)
}

function readLegacyState(): PlusBillingState | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(LEGACY_PLUS_BILLING_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PlusBillingState> & { active?: boolean }
    if (parsed.active !== true) return null
    return normalizeParsed({
      plan: 'plus',
      active: true,
      customerId: parsed.customerId ?? null,
      subscriptionId: parsed.subscriptionId ?? null,
      paymentStatus: parsed.paymentStatus ?? null,
      sessionStatus: parsed.sessionStatus ?? null,
      updatedAt: parsed.updatedAt ?? Date.now(),
    })
  } catch {
    return null
  }
}

export function readPlusBillingState(): PlusBillingState {
  if (typeof window === 'undefined') return emptyState()

  try {
    const raw = window.localStorage.getItem(PLUS_BILLING_STATE_KEY)
    if (!raw) {
      const legacy = readLegacyState()
      if (legacy) {
        writePlusBillingState(legacy)
        return legacy
      }
      return emptyState()
    }

    const parsed = JSON.parse(raw) as Partial<PlusBillingState>
    const normalized = normalizeParsed(parsed)

    if (normalized.active !== parsed.active) {
      writePlusBillingState(normalized)
    }

    return normalized
  } catch {
    return emptyState()
  }
}

export function writePlusBillingState(next: PlusBillingState): void {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(PLUS_BILLING_STATE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(PLUS_BILLING_CHANGED_EVENT))
}

/** @deprecated Nur für Übergang — bevorzugt applyServerBillingState nach Stripe-Sync. */
export function activatePlusBilling(input: {
  customerId?: string | null
  subscriptionId?: string | null
  paymentStatus?: string | null
  sessionStatus?: string | null
}): PlusBillingState {
  const previous = readPlusBillingState()
  return applyServerBillingState({
    plusActive: true,
    plan: 'plus',
    customerId: input.customerId ?? previous.customerId,
    subscriptionId: input.subscriptionId ?? previous.subscriptionId,
    subscriptionStatus: input.paymentStatus ?? previous.subscriptionStatus ?? 'active',
    plusUntil: previous.plusUntil,
    cancelAtPeriodEnd: previous.cancelAtPeriodEnd,
    paymentStatus: input.paymentStatus ?? previous.paymentStatus,
    sessionStatus: input.sessionStatus ?? previous.sessionStatus,
  })
}

export function deactivatePlusBilling(): void {
  writePlusBillingState(emptyState())
}

export function applyServerBillingState(input: {
  plusActive: boolean
  plan?: 'free' | 'plus'
  customerId?: string | null
  subscriptionId?: string | null
  subscriptionStatus?: string | null
  plusUntil?: string | null
  cancelAtPeriodEnd?: boolean
  paymentStatus?: string | null
  sessionStatus?: string | null
}): PlusBillingState {
  if (!input.plusActive) {
    deactivatePlusBilling()
    return emptyState()
  }

  const previous = readPlusBillingState()
  const next = withDerivedActive({
    plan: input.plan ?? (input.plusActive ? 'plus' : 'free'),
    customerId: input.customerId ?? previous.customerId,
    subscriptionId: input.subscriptionId ?? previous.subscriptionId,
    subscriptionStatus: input.subscriptionStatus ?? previous.subscriptionStatus,
    plusUntil: input.plusUntil ?? previous.plusUntil,
    cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? previous.cancelAtPeriodEnd,
    paymentStatus: input.paymentStatus ?? previous.paymentStatus,
    sessionStatus: input.sessionStatus ?? previous.sessionStatus,
    updatedAt: Date.now(),
  })

  writePlusBillingState(next)
  return next
}
