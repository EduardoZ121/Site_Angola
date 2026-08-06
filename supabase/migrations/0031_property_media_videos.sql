-- 0031_property_media_videos.sql
-- Allow listing gallery to store photographs and videos.

alter table public.property_media
  add column if not exists media_kind text;

update public.property_media
set media_kind = 'image'
where media_kind is null;

alter table public.property_media
  alter column media_kind set default 'image';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'property_media_media_kind_check'
  ) then
    alter table public.property_media
      add constraint property_media_media_kind_check
      check (media_kind in ('image', 'video'));
  end if;
end $$;

comment on column public.property_media.media_kind is
  'image | video — gallery items for património listings.';

comment on table public.property_media is
  'Listing photographs and videos for properties (primary + ordered gallery).';

-- Storage: raise size limit and allow common video MIME types (keep images).
update storage.buckets
set
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-m4v'
  ]
where id = 'property-media';
