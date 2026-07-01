
-- Roles
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can read own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin to the designated email once verified
create or replace function public.grant_admin_for_designated_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null
     and lower(new.email) = 'swisdom279@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created_grant_admin
after insert on auth.users
for each row execute function public.grant_admin_for_designated_email();

create trigger on_auth_user_confirmed_grant_admin
after update of email_confirmed_at on auth.users
for each row
when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.grant_admin_for_designated_email();

-- Store overrides
create table public.store_overrides (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  store_name text,
  overall_score integer,
  grade text,
  health text,
  total_issues integer,
  critical_issues integer,
  warnings integer,
  opportunities integer,
  conversion_potential numeric,
  seo_score integer,
  performance_score integer,
  setup_score integer,
  retention_score integer,
  marketing_score integer,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.store_overrides to anon;
grant select, insert, update, delete on public.store_overrides to authenticated;
grant all on public.store_overrides to service_role;

alter table public.store_overrides enable row level security;

create policy "Anyone can read store overrides"
on public.store_overrides for select
to anon, authenticated
using (true);

create policy "Admins can insert store overrides"
on public.store_overrides for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update store overrides"
on public.store_overrides for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete store overrides"
on public.store_overrides for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger store_overrides_updated_at
before update on public.store_overrides
for each row execute function public.set_updated_at();
