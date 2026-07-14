export const PLUS_BILLING_CHANGED_EVENT = 'behoerdenpost-plus-billing-changed'

const PLUS_BILLING_STATE_KEY = 'behoerdenpost.plusBilling.v1'

export type PlusBillingState = {
  active: boolean
  customerId: string | null
  subscriptionId: string | null
  paymentStatus: string | null
  sessionStatus: string | null
  updatedAt: number
}

function emptyState(): PlusBillingState {
  return {
    active: false,
    customerId: null,
    subscriptionId: null,
    paymentStatus: null,
    sessionStatus: null,
    updatedAt: 0,
  }
}

export function readPlusBillingState(): PlusBillingState {
  if (typeof window === 'undefined') return emptyState()

  try {
    const raw = window.localStorage.getItem(PLUS_BILLING_STATE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<PlusBillingState>
    return {
      active: parsed.active === true,
      customerId: typeof parsed.customerId === 'string' ? parsed.customerId : null,
      subscriptionId: typeof parsed.subscriptionId === 'string' ? parsed.subscriptionId : null,
      paymentStatus: typeof parsed.paymentStatus === 'string' ? parsed.paymentStatus : null,
      sessionStatus: typeof parsed.sessionStatus === 'string' ? parsed.sessionStatus : null,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    }
  } catch {
    return emptyState()
  }
}

export function writePlusBillingState(next: PlusBillingState): void {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(PLUS_BILLING_STATE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(PLUS_BILLING_CHANGED_EVENT))
}

export function activatePlusBilling(input: {
  customerId?: string | null
  subscriptionId?: string | null
  paymentStatus?: string | null
  sessionStatus?: string | null
}): PlusBillingState {
  const previous = readPlusBillingState()
  const next: PlusBillingState = {
    active: true,
    customerId: input.customerId ?? previous.customerId,
    subscriptionId: input.subscriptionId ?? previous.subscriptionId,
    paymentStatus: input.paymentStatus ?? previous.paymentStatus,
    sessionStatus: input.sessionStatus ?? previous.sessionStatus,
    updatedAt: Date.now(),
  }
  writePlusBillingState(next)
  return next
}

export function deactivatePlusBilling(): void {
  writePlusBillingState(emptyState())
}

export function applyServerBillingState(input: {
  plusActive: boolean
  customerId?: string | null
  subscriptionId?: string | null
  subscriptionStatus?: string | null
}): PlusBillingState {
  if (!input.plusActive) {
    deactivatePlusBilling()
    return emptyState()
  }

  return activatePlusBilling({
    customerId: input.customerId,
    subscriptionId: input.subscriptionId,
    paymentStatus: input.subscriptionStatus ?? 'active',
    sessionStatus: 'complete',
  })
}
