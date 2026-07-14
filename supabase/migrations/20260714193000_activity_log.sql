-- Nutzeraktivitäten (local-first: Geräte-ID + Vorname, kein Login nötig)

create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  device_id text not null,
  first_name text not null default 'Nutzer',
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_at_idx
  on public.activity_log (created_at desc);

create index if not exists activity_log_device_id_idx
  on public.activity_log (device_id);

create index if not exists activity_log_action_idx
  on public.activity_log (action);

alter table public.activity_log enable row level security;

comment on table public.activity_log is 'Protokoll wichtiger Nutzeraktionen (Geräte-ID + Vorname)';
