-- Create player_videos table
create table public.player_videos (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  match_id uuid references public.matches(id),
  title text not null,
  url text not null,
  video_type text default 'highlight',
  duration_seconds int,
  created_at timestamptz default now()
);

-- RLS
alter table public.player_videos enable row level security;

-- Anyone can view player videos
create policy "Player videos are publicly viewable"
  on public.player_videos for select
  using (true);
