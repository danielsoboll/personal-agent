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
  npx supabase link --project-ref "$PROJECT_REF" --yes
fi

echo "→ Migrationen …"
if ! npx supabase db push --yes 2>&1; then
  echo "⚠ db push fehlgeschlagen — ggf. schon angewendet. migration repair prüfen."
fi

echo "→ Edge Functions deploy …"
npx supabase functions deploy create-checkout-session --yes
npx supabase functions deploy create-customer-portal-session --yes
npx supabase functions deploy verify-checkout-session --yes
npx supabase functions deploy sync-family-billing --yes
npx supabase functions deploy stripe-webhook --yes
npx supabase functions deploy billing-recovery --yes
npx supabase functions deploy log-activity --yes

echo ""
echo "Fertig. Webhook-URL:"
echo "https://${PROJECT_REF}.supabase.co/functions/v1/stripe-webhook"
