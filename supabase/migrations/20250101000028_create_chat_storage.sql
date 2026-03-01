-- Chat file attachments storage bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760, -- 10MB
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

-- Storage RLS: authenticated users can upload to their conversation's folder
create policy "Participants upload chat files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
      and (
        c.scout_id = auth.uid()
        or (
          public.get_user_role() = 'academy_admin'
          and public.get_user_club_id() = c.club_id
        )
      )
    )
  );

-- Storage RLS: conversation participants can read files
create policy "Participants read chat files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-attachments'
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
      and (
        c.scout_id = auth.uid()
        or (
          public.get_user_role() = 'academy_admin'
          and public.get_user_club_id() = c.club_id
        )
        or public.get_user_role() = 'platform_admin'
      )
    )
  );
