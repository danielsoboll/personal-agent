# Behördenpost

Teil des Projekts **Persönlicher Agent**.

## Stack

- Next.js 16 (App Router)
- Supabase (Auth + Postgres)
- Vercel Deployment
- PWA-first, native Mobile später

## Konventionen

- Sprache der UI: Deutsch
- Zeitzone für Fristen/Kalender: `Europe/Berlin`
- Env-Beispiel: `.env.example` — Secrets nie committen

## Agent & Deploy

| | |
|---|---|
| Branch | `main` — Push erlaubt wenn Aufgabe fertig |
| Supabase | `nlpwqxytdkubehdwatgc` |
| Production | post.life-xp.de (Vercel via GitHub) |
| Deploy | `bash scripts/deploy-supabase-billing.sh` |
| Stripe Webhook | `https://nlpwqxytdkubehdwatgc.supabase.co/functions/v1/stripe-webhook` |
| PLUS-Billing | `billing_devices.plus_until` — DB-first wie LifeXP Family |

Setup-Checkliste (einmalig): `~/.cursor/AGENT-SETUP.md`
