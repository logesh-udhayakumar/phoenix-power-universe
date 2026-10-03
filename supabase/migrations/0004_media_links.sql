-- Phoenix Power Universe — external media links on projects.
--
-- Photos and videos that live somewhere else (YouTube, Instagram, or a direct
-- image/video URL) and are shown in the project gallery alongside uploaded
-- files. Stored as a JSON array of URL strings in a text column: the owner
-- types a comma- or line-separated list and the app normalises it.
--
-- A text column rather than jsonb on purpose — nothing queries inside this
-- value, it is only ever read back whole and rendered, and text keeps the
-- draft -> save round trip lossless if the owner pastes something unusual.

alter table public.projects
  add column if not exists media_links text;

comment on column public.projects.media_links is
  'JSON array of external media URLs (YouTube / Instagram / direct image or video links) shown in the project gallery.';
