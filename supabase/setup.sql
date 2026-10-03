-- Phoenix Power Universe — complete database setup.
-- Paste this whole file into the Supabase SQL Editor and run it.
-- Safe to re-run: every statement is idempotent.

-- ============================================================
-- 0001_schema.sql
-- ============================================================
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

-- ============================================================
-- 0002_rls.sql
-- ============================================================
-- Phoenix Power Universe — Row Level Security
-- Deny by default: RLS on every table, then explicit grants.
-- Public (anon) may READ published content only. All writes require an
-- authenticated user listed in admin_users (public.is_admin()).

alter table public.admin_users   enable row level security;
alter table public.categories    enable row level security;
alter table public.projects      enable row level security;
alter table public.project_media enable row level security;
alter table public.services      enable row level security;
alter table public.testimonials  enable row level security;
alter table public.enquiries     enable row level security;
alter table public.settings      enable row level security;

-- ------------------------------------------------------------ admin_users
drop policy if exists admin_users_self_read on public.admin_users;
create policy admin_users_self_read on public.admin_users
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- Intentionally no insert/update/delete policy: admins are added by the
-- service role (seed script / Supabase dashboard), never from the browser.

-- ------------------------------------------------------------ categories
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select to anon, authenticated using (is_active);

drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------ projects
drop policy if exists projects_public_read on public.projects;
create policy projects_public_read on public.projects
  for select to anon, authenticated using (status = 'published');

drop policy if exists projects_admin_all on public.projects;
create policy projects_admin_all on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------ project_media
-- Media is readable only when its parent project is published, otherwise a
-- draft project's photos would be fetchable by guessing the media table.
drop policy if exists project_media_public_read on public.project_media;
create policy project_media_public_read on public.project_media
  for select to anon, authenticated using (
    exists (select 1 from public.projects p
            where p.id = project_media.project_id and p.status = 'published')
  );

drop policy if exists project_media_admin_all on public.project_media;
create policy project_media_admin_all on public.project_media
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------ services
drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services
  for select to anon, authenticated using (is_active);

drop policy if exists services_admin_all on public.services;
create policy services_admin_all on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------ testimonials
drop policy if exists testimonials_public_read on public.testimonials;
create policy testimonials_public_read on public.testimonials
  for select to anon, authenticated using (is_published);

drop policy if exists testimonials_admin_all on public.testimonials;
create policy testimonials_admin_all on public.testimonials
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------ enquiries
-- The contact form is submitted server-side by an unauthenticated visitor,
-- so anon may INSERT. It may never read back: enquiries hold other people's
-- phone numbers. Only admins can list them.
drop policy if exists enquiries_public_insert on public.enquiries;
create policy enquiries_public_insert on public.enquiries
  for insert to anon, authenticated with check (true);

drop policy if exists enquiries_admin_read on public.enquiries;
create policy enquiries_admin_read on public.enquiries
  for select to authenticated using (public.is_admin());

drop policy if exists enquiries_admin_write on public.enquiries;
create policy enquiries_admin_write on public.enquiries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists enquiries_admin_delete on public.enquiries;
create policy enquiries_admin_delete on public.enquiries
  for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------ settings
drop policy if exists settings_public_read on public.settings;
create policy settings_public_read on public.settings
  for select to anon, authenticated using (true);

drop policy if exists settings_admin_all on public.settings;
create policy settings_admin_all on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 0003_storage.sql
-- ============================================================
-- Phoenix Power Universe — Storage buckets and policies.
-- Buckets are public-read (project photos are meant to be seen) but only
-- admins may upload, overwrite or delete. File-size and MIME limits are set
-- on the bucket so a bad upload is rejected by the server, not just the UI.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('project-images',    'project-images',    true,  10485760,
     array['image/jpeg','image/png','image/webp']),
  ('project-videos',    'project-videos',    true, 104857600,
     array['video/mp4','video/webm','video/quicktime']),
  ('service-images',    'service-images',    true,  10485760,
     array['image/jpeg','image/png','image/webp']),
  ('testimonial-images','testimonial-images',true,   5242880,
     array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$
declare b text;
begin
  foreach b in array array['project-images','project-videos','service-images','testimonial-images'] loop
    execute format('drop policy if exists %I on storage.objects', b || '_public_read');
    execute format($p$create policy %I on storage.objects
        for select to anon, authenticated using (bucket_id = %L)$p$, b || '_public_read', b);

    execute format('drop policy if exists %I on storage.objects', b || '_admin_write');
    execute format($p$create policy %I on storage.objects
        for all to authenticated
        using (bucket_id = %L and public.is_admin())
        with check (bucket_id = %L and public.is_admin())$p$, b || '_admin_write', b, b);
  end loop;
end $$;

