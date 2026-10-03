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
