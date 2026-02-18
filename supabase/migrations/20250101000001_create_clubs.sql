-- Create clubs table
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ka text not null,
  slug text unique not null,
  logo_url text,
  city text,
  region text,
  description text,
  description_ka text,
  website text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.clubs enable row level security;

-- Anyone can view clubs
create policy "Clubs are publicly viewable"
  on public.clubs for select
  using (true);
