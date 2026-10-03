-- Phoenix Power Universe — core schema
-- Run in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------- helpers
-- Admins are a table, not a hard-coded list, so more can be added later
-- without a code change. is_admin() is what every write policy checks.
create table if not exists public.admin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'admin' check (role in ('admin', 'owner')),
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where id = auth.uid());
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- tables
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  image_url     text,
  display_order integer not null default 0,
  is_active     boolean not null default true,
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  description     text,
  scope_of_work   text[] not null default '{}',
  category_id     uuid references public.categories(id) on delete set null,
  project_type    text not null default 'Other'
                  check (project_type in ('Residential','Commercial','Industrial','Other')),
  location        text,
  city            text,
  state           text,
  completion_date date,
  featured        boolean not null default false,
  status          text not null default 'draft' check (status in ('draft','published')),
  cover_image_url text,
  display_order   integer not null default 0,
  is_demo         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.project_media (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  media_type    text not null check (media_type in ('image','video')),
  file_url      text not null,
  thumbnail_url text,
  caption       text,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  details       text[] not null default '{}',
  image_url     text,
  icon          text,
  display_order integer not null default 0,
  is_active     boolean not null default true,
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  customer_name text not null,
  company_name  text,
  content       text not null,
  rating        integer check (rating between 1 and 5),
  image_url     text,
  is_published  boolean not null default false,
  display_order integer not null default 0,
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.enquiries (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  phone        text not null,
  email        text,
  company      text,
  message      text,
  project_type text,
  status       text not null default 'new' check (status in ('new','contacted','closed')),
  created_at   timestamptz not null default now()
);

-- Owner-editable site settings (phone, WhatsApp, email, areas...). One row
-- per key so the owner can change contact details without a deploy.
create table if not exists public.settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- indexes
create index if not exists projects_status_idx      on public.projects(status);
create index if not exists projects_featured_idx    on public.projects(featured) where featured;
create index if not exists projects_category_idx    on public.projects(category_id);
create index if not exists projects_type_idx        on public.projects(project_type);
create index if not exists projects_created_idx     on public.projects(created_at desc);
create index if not exists projects_search_idx      on public.projects using gin (
  (coalesce(title,'') || ' ' || coalesce(city,'') || ' ' || coalesce(location,'')) gin_trgm_ops
);
create index if not exists project_media_project_idx on public.project_media(project_id, display_order);
create index if not exists enquiries_created_idx     on public.enquiries(created_at desc);

-- ---------------------------------------------------------------- triggers
do $$
declare t text;
begin
  foreach t in array array['categories','projects','services','testimonials','settings'] loop
    execute format(
      'drop trigger if exists %I_touch on public.%I;
       create trigger %I_touch before update on public.%I
       for each row execute function public.touch_updated_at();',
      t, t, t, t);
  end loop;
end $$;
