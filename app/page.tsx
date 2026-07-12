import { isSupabaseConfigured } from '@/lib/supabase'

export default function HomePage() {
  const supabaseReady = isSupabaseConfigured()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-semibold text-white">
            B
          </div>
          <div>
            <p className="text-sm font-medium text-muted">Persönlicher Agent</p>
            <h1 className="text-lg font-semibold tracking-tight">Behördenpost</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-12">
        <section className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Web-App · PWA-ready
          </p>
          <h2 className="max-w-xl text-4xl font-semibold tracking-tight text-balance">
            Behördenpost digital organisieren
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-muted">
            Briefe, Fristen und Antworten an einem Ort. Die App startet als Web-App
            und ist für iOS und Android vorbereitet.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <StatusCard
            title="Next.js"
            detail="Frontend und API-Routen"
            ready
          />
          <StatusCard
            title="Supabase"
            detail={supabaseReady ? 'Umgebungsvariablen gesetzt' : 'Projekt anlegen und Keys eintragen'}
            ready={supabaseReady}
          />
          <StatusCard title="GitHub" detail="Repo personal-agent" ready />
          <StatusCard title="Vercel" detail="Nach Push importieren" ready={false} />
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold">Nächste Schritte</h3>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-muted">
            <li>1. Supabase-Projekt anlegen und `.env.local` aus `.env.example` füllen</li>
            <li>2. `npm run dev` starten und lokal testen</li>
            <li>3. Repo auf GitHub pushen und in Vercel importieren</li>
            <li>4. Erste Features: Posteingang, Fristen, Dokumente</li>
          </ol>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-4 text-center text-sm text-muted">
        Behördenpost · Teil des Projekts Persönlicher Agent
      </footer>
    </div>
  )
}

function StatusCard({
  title,
  detail,
  ready,
}: {
  title: string
  detail: string
  ready: boolean
}) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium">{title}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            ready
              ? 'bg-accent-soft text-accent'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
          }`}
        >
          {ready ? 'Bereit' : 'Offen'}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </article>
  )
}
