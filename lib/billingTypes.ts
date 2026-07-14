export type CheckoutSessionResponse = {
  id?: string
  url?: string
  status?: string
}

export type VerifiedCheckoutResponse = {
  ok?: boolean
  isComplete?: boolean
  paymentStatus?: string | null
  sessionStatus?: string | null
  customerId?: string | null
  subscriptionId?: string | null
  plus_synced?: boolean
}

export type BillingApiBody = {
  billing_device_id?: string
  site_url?: string
  session_id?: string
  customer_id?: string
}

export type BillingSyncResponse = {
  ok?: boolean
  synced?: boolean
  plan?: 'free' | 'plus'
  plusActive?: boolean
  customerId?: string | null
  subscriptionId?: string | null
  subscriptionStatus?: string | null
  plusUntil?: string | null
  cancelAtPeriodEnd?: boolean
  message?: string | null
}
