-- Add country field to profiles for scout demand tracking
alter table public.profiles add column if not exists country text;

-- Update signup trigger to store country from metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, organization, country, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'organization', ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'country', '')), ''),
    'scout'
  );
  return new;
end;
$$ language plpgsql security definer;

-- RPC: Scout demand by country for a club (this month)
create or replace function get_scout_demand_by_country(p_club_id uuid)
returns table(country text, view_count bigint)
language sql
security definer
stable
as $$
  select
    coalesce(pr.country, 'Unknown') as country,
    count(*) as view_count
  from player_views pv
  join profiles pr on pr.id = pv.viewer_id
  join players pl on pl.id = pv.player_id
  where pl.club_id = p_club_id
    and pv.viewed_at >= date_trunc('month', now())
    and pr.role = 'scout'
  group by pr.country
  order by view_count desc;
$$;

-- RPC: Scout demand by country for a specific player (this week)
create or replace function get_player_scout_demand(p_player_id uuid)
returns table(country text, view_count bigint)
language sql
security definer
stable
as $$
  select
    coalesce(pr.country, 'Unknown') as country,
    count(*) as view_count
  from player_views pv
  join profiles pr on pr.id = pv.viewer_id
  where pv.player_id = p_player_id
    and pv.viewed_at >= now() - interval '7 days'
    and pr.role = 'scout'
  group by pr.country
  order by view_count desc;
$$;

-- RPC: Last month's scout demand by country for trend comparison
create or replace function get_scout_demand_last_month(p_club_id uuid)
returns table(country text, view_count bigint)
language sql
security definer
stable
as $$
  select
    coalesce(pr.country, 'Unknown') as country,
    count(*) as view_count
  from player_views pv
  join profiles pr on pr.id = pv.viewer_id
  join players pl on pl.id = pv.player_id
  where pl.club_id = p_club_id
    and pv.viewed_at >= date_trunc('month', now()) - interval '1 month'
    and pv.viewed_at < date_trunc('month', now())
    and pr.role = 'scout'
  group by pr.country
  order by view_count desc;
$$;
