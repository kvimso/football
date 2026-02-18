-- Create players table
create table public.players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  name text not null,
  name_ka text not null,
  slug text unique not null,
  date_of_birth date not null,
  nationality text default 'Georgian',
  position text not null,
  preferred_foot text,
  height_cm int,
  weight_kg int,
  photo_url text,
  jersey_number int,
  scouting_report text,
  scouting_report_ka text,
  status text default 'active',
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_players_club on public.players(club_id);
create index idx_players_position on public.players(position);
create index idx_players_slug on public.players(slug);

-- RLS
alter table public.players enable row level security;

-- Anyone can view players
create policy "Players are publicly viewable"
  on public.players for select
  using (true);
