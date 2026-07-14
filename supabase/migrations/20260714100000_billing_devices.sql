-- Gerätegebundenes PLUS-Billing (local-first, ohne Login)
-- Stripe-Webhook und Edge Functions schreiben hierher (Service Role).

create table if not exists public.billing_devices (
  device_id text primary key,
  profile_id uuid references public.profiles (id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'free' check (plan in ('free', 'plus')),
  subscription_status text,
  plus_until timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_devices_stripe_customer_id_idx
  on public.billing_devices (stripe_customer_id);

create index if not exists billing_devices_stripe_subscription_id_idx
  on public.billing_devices (stripe_subscription_id);

create index if not exists billing_devices_profile_id_idx
  on public.billing_devices (profile_id);

alter table public.billing_devices enable row level security;

comment on table public.billing_devices is 'Stripe-PLUS-Status pro App-Gerät (billing_device_id aus localStorage)';
