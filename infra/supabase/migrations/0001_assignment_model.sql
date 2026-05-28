-- Migration: assignment model fields for restaurants and VIP customers.
-- Idempotent; safe to run multiple times in the Supabase SQL editor.

create extension if not exists "uuid-ossp";

-- Ensure the VIP customers table exists (some environments never created it).
create table if not exists vip_customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_name text null,
  contact_phone text null,
  city text not null,
  is_active boolean not null default true,
  assigned_courier_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table vip_customers enable row level security;

drop policy if exists "admin_full_vip_customers" on vip_customers;
create policy "admin_full_vip_customers" on vip_customers
  for all
  using (auth.role() = 'authenticated' or auth.role() = 'service_role')
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

alter table restaurants add column if not exists code text;
alter table restaurants add column if not exists street text;
alter table restaurants add column if not exists street_number text;
alter table restaurants add column if not exists special_directions text;
alter table restaurants add column if not exists zone text;
alter table restaurants add column if not exists vip_status text not null default 'one_full';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'restaurants_vip_status_check'
  ) then
    alter table restaurants
      add constraint restaurants_vip_status_check
      check (vip_status in ('half_time', 'one_full', 'two_full'));
  end if;
end$$;

-- Allow restaurants without a legacy full address (we now build it from parts).
alter table restaurants alter column address drop not null;
alter table restaurants alter column priority drop not null;
alter table restaurants alter column priority set default 2;

alter table vip_customers add column if not exists code text;
alter table vip_customers add column if not exists street text;
alter table vip_customers add column if not exists street_number text;
alter table vip_customers add column if not exists special_directions text;
alter table vip_customers add column if not exists zone text;
alter table vip_customers add column if not exists vip_status text not null default 'one_full';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'vip_customers_vip_status_check'
  ) then
    alter table vip_customers
      add constraint vip_customers_vip_status_check
      check (vip_status in ('half_time', 'one_full', 'two_full'));
  end if;
end$$;
