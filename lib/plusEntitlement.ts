import type { PlusBillingState } from '@/lib/plusBillingStorage'

const ACTIVE_PLUS_STATUSES = new Set(['active', 'trialing', 'past_due'])

/** Status, bei denen trotz gültigem plus_until kein PLUS mehr gilt. */
const BLOCKING_PLUS_STATUSES = new Set(['unpaid', 'incomplete_expired'])

export function parsePlusUntilMs(plusUntil: string | null | undefined): number | null {
  if (!plusUntil) return null
  const ms = Date.parse(plusUntil)
  return Number.isNaN(ms) ? null : ms
}

export function isPlusPaidThrough(plusUntil: string | null | undefined, nowMs = Date.now()): boolean {
  const untilMs = parsePlusUntilMs(plusUntil)
  return untilMs !== null && untilMs > nowMs
}

/**
 * PLUS-Zugang wie LifeXP Family:
 * primär plus_until > jetzt (Stripe current_period_end),
 * Fallback plan=plus + aktiver Abo-Status (Sync-Lag nach Checkout).
 */
export function isPlusEntitled(
  state:
    | Pick<
        PlusBillingState,
        'plan' | 'plusUntil' | 'subscriptionStatus' | 'cancelAtPeriodEnd'
      >
    | null
    | undefined,
): boolean {
  if (!state) return false

  const status = state.subscriptionStatus
  if (status && BLOCKING_PLUS_STATUSES.has(status)) return false

  if (isPlusPaidThrough(state.plusUntil)) return true

  if (state.plan !== 'plus') return false
  if (!status) return false
  return ACTIVE_PLUS_STATUSES.has(status)
}

function formatPlusUntilDe(plusUntil: string): string {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(plusUntil))
}

export function plusStatusLabel(
  state:
    | Pick<
        PlusBillingState,
        'plan' | 'plusUntil' | 'subscriptionStatus' | 'cancelAtPeriodEnd'
      >
    | null
    | undefined,
): string {
  if (!state) return 'Kostenlos'

  if (isPlusEntitled(state)) {
    if (state.subscriptionStatus === 'trialing') return 'PLUS (Testphase)'
    if (state.cancelAtPeriodEnd && state.plusUntil) {
      const untilLabel = formatPlusUntilDe(state.plusUntil)
      return untilLabel ? `PLUS bis ${untilLabel}` : 'PLUS (gekündigt)'
    }
    if (state.subscriptionStatus === 'past_due') return 'PLUS — Zahlung offen'
    return 'PLUS aktiv'
  }

  if (state.subscriptionStatus === 'past_due') return 'Zahlung offen'
  return 'Kostenlos'
}

export function plusTarifLine(state: PlusBillingState | null | undefined): string {
  return `Dein Tarif: ${plusStatusLabel(state)}`
}
