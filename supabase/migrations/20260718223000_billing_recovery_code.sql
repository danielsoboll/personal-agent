-- Wiederherstellungscode für PLUS (device-bound, analog LifeXP Family rec_code)

alter table public.billing_devices
  add column if not exists rec_code text,
  add column if not exists rec_code_ok boolean not null default false;

create unique index if not exists billing_devices_rec_code_uidx
  on public.billing_devices (rec_code)
  where rec_code is not null;

comment on column public.billing_devices.rec_code is
  'Wiederherstellungscode (POST-XXXX-XXXX) — PLUS auf neuem Gerät wiederherstellen';
comment on column public.billing_devices.rec_code_ok is
  'Nutzer hat bestätigt, den Recovery-Code gesichert zu haben';
