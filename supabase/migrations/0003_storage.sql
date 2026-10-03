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
