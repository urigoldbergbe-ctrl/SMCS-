create extension if not exists "uuid-ossp";

create table if not exists dispatch_config (
  id uuid primary key default uuid_generate_v4(),
  city text not null,
  config_key text not null,
  config_value jsonb not null,
  effective_from timestamptz not null default now(),
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_dispatch_config_city_key on dispatch_config(city, config_key);

create table if not exists dispatch_config_history (
  id uuid primary key default uuid_generate_v4(),
  config_snapshot jsonb not null,
  changed_by text not null,
  changed_at timestamptz not null default now(),
  change_note text null
);

create table if not exists couriers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null unique,
  city text not null,
  vehicle_type text not null check (vehicle_type in ('scooter', 'bike', 'car')),
  preferred_language text not null default 'en',
  assigned_restaurant_ids uuid[] not null default '{}',
  contract_type text not null default 'sub_contractor',
  status text not null check (status in ('online', 'offline', 'on_run')),
  current_order_id text null,
  last_seen_at timestamptz null,
  is_active boolean not null default true,
  notes text null,
  onboarding_token text null,
  created_at timestamptz not null default now()
);

create table if not exists courier_locations (
  id uuid primary key default uuid_generate_v4(),
  courier_id uuid not null references couriers(id),
  lat double precision not null,
  lng double precision not null,
  recorded_at timestamptz not null default now(),
  order_id text null
);

create index if not exists idx_courier_locations_courier_recorded_at
  on courier_locations(courier_id, recorded_at desc);

create table if not exists restaurants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text not null,
  city text not null,
  code text null,
  street text null,
  street_number text null,
  special_directions text null,
  zone text null,
  vip_status text not null default 'one_full' check (vip_status in ('half_time', 'one_full', 'two_full')),
  eligible_tracks text[] not null default '{}',
  ov_cap_percent integer not null default 30,
  priority integer not null check (priority in (1, 2, 3)),
  alert_threshold_percent integer not null default 80,
  corporate_client boolean not null default false,
  peak_ov_cap_percent integer null,
  is_active boolean not null default true
);

create table if not exists vip_customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_name text null,
  contact_phone text null,
  city text not null,
  code text null,
  street text null,
  street_number text null,
  special_directions text null,
  zone text null,
  vip_status text not null default 'one_full' check (vip_status in ('half_time', 'one_full', 'two_full')),
  is_active boolean not null default true,
  assigned_courier_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists trips (
  id uuid primary key default uuid_generate_v4(),
  courier_id uuid not null references couriers(id),
  restaurant_id uuid not null references restaurants(id),
  order_id text not null,
  order_source text not null check (order_source in ('integrated', 'manual')),
  track text not null,
  assigned_via text not null check (assigned_via in ('strategic', 'delco')),
  reassigned_flag boolean not null default false,
  dispatch_time timestamptz not null,
  pickup_time timestamptz null,
  delivery_time timestamptz null,
  ptod_minutes numeric(5, 2) null,
  cancellation_flag boolean not null default false,
  cancellation_reason text null,
  photo_proof_url text null,
  courier_notes text null
);

create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  actor text not null check (actor in ('dispatch_engine', 'admin', 'system', 'ai_advisor')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists support_tickets (
  id uuid primary key default uuid_generate_v4(),
  courier_id uuid not null references couriers(id),
  status text not null check (status in ('open', 'ai_handling', 'escalated', 'resolved')),
  escalation_reason text null,
  chat_transcript jsonb not null default '[]'::jsonb,
  resolution_tag text null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create table if not exists manual_orders (
  id uuid primary key default uuid_generate_v4(),
  restaurant_name text not null,
  restaurant_address_full text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_address_full text not null,
  notes text not null default '',
  status text not null check (status in ('pending_dispatch', 'assigned', 'picked_up', 'delivered')),
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists simulation_runs (
  id uuid primary key default uuid_generate_v4(),
  city text not null,
  request_payload jsonb not null,
  result_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists ai_advisor_logs (
  id uuid primary key default uuid_generate_v4(),
  city text not null,
  intent text not null,
  prompt text not null,
  recommendation text not null,
  rationale jsonb not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists integration_outbox (
  id uuid primary key default uuid_generate_v4(),
  endpoint text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts integer not null default 0,
  last_error text null,
  next_retry_at timestamptz null,
  created_at timestamptz not null default now(),
  sent_at timestamptz null
);

create index if not exists idx_manual_orders_status_created_at on manual_orders(status, created_at desc);
create index if not exists idx_integration_outbox_status_next_retry on integration_outbox(status, next_retry_at);

-- RLS baseline
alter table couriers enable row level security;
alter table courier_locations enable row level security;
alter table trips enable row level security;
alter table audit_log enable row level security;
alter table restaurants enable row level security;
alter table dispatch_config enable row level security;
alter table dispatch_config_history enable row level security;
alter table support_tickets enable row level security;
alter table manual_orders enable row level security;
alter table vip_customers enable row level security;
alter table app_settings enable row level security;
alter table simulation_runs enable row level security;
alter table ai_advisor_logs enable row level security;
alter table integration_outbox enable row level security;

-- Example policy skeletons (replace auth.uid() mapping with your identity strategy)
drop policy if exists "admin_full_couriers" on couriers;
create policy "admin_full_couriers" on couriers
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "append_only_audit_log" on audit_log;
create policy "append_only_audit_log" on audit_log
  for insert
  with check (true);

drop policy if exists "admin_full_dispatch_config" on dispatch_config;
create policy "admin_full_dispatch_config" on dispatch_config
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "admin_full_restaurants" on restaurants;
create policy "admin_full_restaurants" on restaurants
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "admin_full_dispatch_config_history" on dispatch_config_history;
create policy "admin_full_dispatch_config_history" on dispatch_config_history
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "admin_full_support_tickets" on support_tickets;
create policy "admin_full_support_tickets" on support_tickets
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "admin_full_manual_orders" on manual_orders;
create policy "admin_full_manual_orders" on manual_orders
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "admin_full_vip_customers" on vip_customers;
create policy "admin_full_vip_customers" on vip_customers
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "admin_full_app_settings" on app_settings;
create policy "admin_full_app_settings" on app_settings
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "admin_full_simulation_runs" on simulation_runs;
create policy "admin_full_simulation_runs" on simulation_runs
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "admin_full_ai_advisor_logs" on ai_advisor_logs;
create policy "admin_full_ai_advisor_logs" on ai_advisor_logs
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "service_full_integration_outbox" on integration_outbox;
create policy "service_full_integration_outbox" on integration_outbox
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
