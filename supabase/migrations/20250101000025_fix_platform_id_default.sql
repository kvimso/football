-- Add DEFAULT for platform_id so Supabase type generation marks it as optional in Insert type.
-- The BEFORE INSERT trigger (generate_platform_id) still works as a safety net.
ALTER TABLE public.players
  ALTER COLUMN platform_id SET DEFAULT 'GFP-' || lpad(nextval('public.player_platform_id_seq')::text, 5, '0');
