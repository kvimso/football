-- Generic updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger update_clubs_updated_at
  before update on public.clubs
  for each row execute function public.update_updated_at_column();

create trigger update_players_updated_at
  before update on public.players
  for each row execute function public.update_updated_at_column();

create trigger update_player_skills_updated_at
  before update on public.player_skills
  for each row execute function public.update_updated_at_column();

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();
