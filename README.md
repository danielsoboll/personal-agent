# Behördenpost

Web-App für **Behördenpost** im Projekt [Persönlicher Agent](https://github.com/danielsoboll/personal-agent).

Stack wie LifeXP:

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4)
- **Supabase** (Auth, Datenbank, Storage)
- **GitHub** + **Vercel** (Deploy)
- **PWA-ready** (installierbar auf iOS/Android, native Apps später)

## Lokal starten

```bash
npm install
cp .env.example .env.local
# Supabase-Keys in .env.local eintragen
npm run dev
```

App: [http://localhost:3002](http://localhost:3002)

## Umgebungsvariablen

| Variable | Wo | Beschreibung |
|----------|-----|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local`, Vercel | Supabase Projekt-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local`, Vercel | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local`, Vercel | Nur serverseitig |
| `OPENAI_API_KEY` | `.env.local`, Vercel | KI-Dokumentenanalyse |
| `OPENAI_MODEL` | optional | Standard: `gpt-4o-mini` |
| `CANONICAL_HOST` | Vercel (optional) | Production-Domain |

## Supabase einrichten

1. Neues Projekt auf [supabase.com](https://supabase.com) anlegen (z. B. `behoerdenpost`)
2. Unter **Settings → API** URL und Anon Key kopieren
3. Migration aus `supabase/migrations/` im SQL Editor ausführen oder mit Supabase CLI pushen

## Vercel deployen

1. Repo auf GitHub pushen
2. [vercel.com/new](https://vercel.com/new) → GitHub-Repo importieren
3. Framework: Next.js (automatisch)
4. Environment Variables wie in `.env.example` setzen
5. Deploy

## Struktur

```
app/           Seiten & Layout
components/    UI-Komponenten
lib/           Supabase-Client, Hilfsfunktionen
public/        Icons, PWA-Manifest
scripts/       Icon-Generierung
supabase/      Datenbank-Migrationen
```

## Mobile (später)

Die Web-App ist als PWA vorbereitet (`manifest.ts`, App-Icons). Native iOS/Android-Apps können später z. B. mit Capacitor oder Expo darauf aufbauen.
