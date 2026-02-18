-- Create matches table
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  home_club_id uuid references public.clubs(id),
  away_club_id uuid references public.clubs(id),
  slug text unique not null,
  home_score int,
  away_score int,
  competition text,
  match_date date not null,
  venue text,
  video_url text,
  highlights_url text,
  match_report text,
  match_report_ka text,
  camera_source text,
  pixellot_event_id text,
  created_at timestamptz default now()
);

-- Indexes
create index idx_matches_date on public.matches(match_date desc);

-- RLS
alter table public.matches enable row level security;

-- Anyone can view matches
create policy "Matches are publicly viewable"
  on public.matches for select
  using (true);
