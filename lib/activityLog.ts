import { getOrCreateBillingDeviceId } from '@/lib/billingDevice'
import { getStoredProfileName } from '@/lib/localProfile'

export type ActivityAction =
  | 'case_created'
  | 'photos_analyzed'
  | 'review_opened'
  | 'final_assessment'
  | 'follow_up_question'
  | 'word_document_created'
  | 'plus_discover_opened'
  | 'plus_checkout_started'
  | 'library_document_opened'

type ActivityDetail = Record<string, string | number | boolean | null>

/** Fire-and-forget — blockiert die UI nicht. */
export function logUserActivity(action: ActivityAction, detail?: ActivityDetail): void {
  if (typeof window === 'undefined') return

  const payload = {
    device_id: getOrCreateBillingDeviceId(),
    first_name: getStoredProfileName() || 'Nutzer',
    action,
    detail: detail ?? null,
  }

  void fetch('/api/activity/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    /* Protokoll optional — kein Fehler in der UI */
  })
}
