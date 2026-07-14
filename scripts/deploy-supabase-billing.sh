#!/usr/bin/env bash
# Behördenpost — Supabase Billing deploy (Edge Functions + Migration)
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-nlpwqxytdkubehdwatgc}"

echo "→ Projekt: $PROJECT_REF"

if ! npx supabase projects list >/dev/null 2>&1; then
  echo "Bitte zuerst: npx supabase login"
  exit 1
fi

if [[ ! -f supabase/.temp/project-ref ]]; then
  npx supabase link --project-ref "$PROJECT_REF"
fi

echo "→ Migration billing_devices …"
npx supabase db push

echo "→ Edge Functions deploy …"
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-customer-portal-session
npx supabase functions deploy verify-checkout-session
npx supabase functions deploy sync-family-billing
npx supabase functions deploy stripe-webhook

echo "Fertig. Webhook-URL:"
echo "https://${PROJECT_REF}.supabase.co/functions/v1/stripe-webhook"
