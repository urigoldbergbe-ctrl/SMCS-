-- Migration: assignment model fields for restaurants and VIP customers.
-- Idempotent; safe to run multiple times.

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
