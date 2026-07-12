-- Behördenpost PLUS — Abrechnungsfelder (Stripe-Vorbereitung)

alter table public.profiles
  add column if not exists plan text not null default 'free',
  add column if not exists subscription_status text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists plus_until timestamptz;

comment on column public.profiles.plan is 'free | plus';
comment on column public.profiles.subscription_status is 'Stripe subscription status mirror';
comment on column public.profiles.plus_until is 'Paid-through timestamp (current_period_end)';

create or replace function public.protect_profile_billing_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' and auth.uid() = old.id then
    if new.plan is distinct from old.plan
      or new.subscription_status is distinct from old.subscription_status
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id
      or new.plus_until is distinct from old.plus_until then
      raise exception 'Billing fields are read-only for clients';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_billing_fields on public.profiles;

create trigger protect_profile_billing_fields
  before update on public.profiles
  for each row
  execute function public.protect_profile_billing_fields();
