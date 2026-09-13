-- lovable-cron-fallback-reviewed: 1440 runs/day; the product requires a score to be published ~1 minute after the admin review window closes, with no client involvement; minute granularity is the coarsest cadence that meets that deadline.

create extension if not exists pg_cron with schema extensions;

-- ============ audits ============
create table public.audits (
  id uuid primary key default gen_random_uuid(),
  public_token text not null unique,
  url text not null,
  domain text not null,
  store_name text,
  status text not null default 'processing',
  score_method text,
  raw_evidence_score integer,
  published_score integer,
  grade text,
  health text,
  result jsonb,
  review_deadline timestamptz not null default (now() + interval '60 seconds'),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index audits_status_idx on public.audits (status, review_deadline);
create index audits_domain_idx on public.audits (domain);

grant all on public.audits to service_role;
grant select on public.audits to authenticated;
alter table public.audits enable row level security;
create policy "Admins can read audits" on public.audits
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create trigger audits_updated_at before update on public.audits
  for each row execute function public.set_updated_at();

-- ============ enterprise benchmarks ============
create table public.enterprise_score_benchmarks (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  created_at timestamptz not null default now()
);
grant all on public.enterprise_score_benchmarks to service_role;
grant select on public.enterprise_score_benchmarks to authenticated;
alter table public.enterprise_score_benchmarks enable row level security;
create policy "Admins can read benchmarks" on public.enterprise_score_benchmarks
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

insert into public.enterprise_score_benchmarks (domain) values
  ('shopify.com'), ('aliexpress.com'), ('jumia.com'), ('jumia.com.ng');

-- ============ merchant toolkit ============
create table public.merchant_toolkit_services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  url text not null,
  description text,
  tags text[] not null default '{}',
  last_verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant all on public.merchant_toolkit_services to service_role;
grant select on public.merchant_toolkit_services to authenticated;
alter table public.merchant_toolkit_services enable row level security;
create policy "Admins can read toolkit services" on public.merchant_toolkit_services
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger merchant_toolkit_services_updated_at before update on public.merchant_toolkit_services
  for each row execute function public.set_updated_at();

create table public.merchant_toolkit_sync_state (
  id boolean primary key default true,
  last_success_at timestamptz,
  last_attempt_at timestamptz,
  last_error text,
  service_count integer not null default 0,
  constraint merchant_toolkit_sync_state_singleton check (id)
);
grant all on public.merchant_toolkit_sync_state to service_role;
alter table public.merchant_toolkit_sync_state enable row level security;
insert into public.merchant_toolkit_sync_state (id) values (true);

-- ============ grade/health helpers ============
create or replace function public.grade_for_score(_score integer)
returns text language sql immutable set search_path = public as $$
  select case
    when _score >= 90 then 'A'
    when _score >= 80 then 'B'
    when _score >= 70 then 'C'
    when _score >= 60 then 'D'
    when _score >= 50 then 'E'
    else 'F' end
$$;

create or replace function public.health_for_score(_score integer)
returns text language sql immutable set search_path = public as $$
  select case
    when _score >= 85 then 'Excellent'
    when _score >= 72 then 'Good'
    when _score >= 58 then 'Fair'
    when _score >= 40 then 'Poor'
    else 'Critical' end
$$;

-- ============ scheduled fallback publisher ============
create or replace function public.publish_due_audits()
returns integer language plpgsql security definer set search_path = public as $$
declare _n integer;
begin
  with updated as (
    update public.audits
       set status = 'published',
           published_score = 56,
           score_method = 'fallback',
           grade = public.grade_for_score(56),
           health = public.health_for_score(56),
           published_at = now()
     where status = 'processing'
       and review_deadline <= now()
    returning 1
  )
  select count(*) into _n from updated;
  return _n;
end;
$$;
revoke all on function public.publish_due_audits() from public, anon, authenticated;

select cron.schedule('storelens-publish-due-audits', '* * * * *', $$select public.publish_due_audits();$$);
