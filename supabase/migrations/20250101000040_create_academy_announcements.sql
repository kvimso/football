-- Academy Announcements table
create table public.academy_announcements (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  content text not null check (char_length(content) <= 500),
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_academy_announcements_club_id on public.academy_announcements(club_id);
create index idx_academy_announcements_created_at on public.academy_announcements(created_at desc);

-- RLS
alter table public.academy_announcements enable row level security;

-- All authenticated users can read announcements
create policy "Authenticated users can read announcements"
  on public.academy_announcements for select
  to authenticated
  using (true);

-- Academy admins can insert announcements for their own club
create policy "Academy admins can insert announcements for own club"
  on public.academy_announcements for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'academy_admin'
        and profiles.club_id = academy_announcements.club_id
    )
  );

-- Academy admins can delete their own club's announcements
create policy "Academy admins can delete announcements for own club"
  on public.academy_announcements for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'academy_admin'
        and profiles.club_id = academy_announcements.club_id
    )
  );
