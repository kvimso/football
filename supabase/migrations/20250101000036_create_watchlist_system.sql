-- Create watchlist system (replaces shortlists)
-- Tables: watchlist, watchlist_folders, watchlist_folder_players, watchlist_tags

-- 1. Watchlist (replaces shortlists)
CREATE TABLE public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, player_id)
);

-- 2. Watchlist folders
CREATE TABLE public.watchlist_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Folder-player junction (many-to-many)
CREATE TABLE public.watchlist_folder_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL REFERENCES public.watchlist_folders(id) ON DELETE CASCADE,
  watchlist_id uuid NOT NULL REFERENCES public.watchlist(id) ON DELETE CASCADE,
  UNIQUE(folder_id, watchlist_id)
);

-- 4. Tags
CREATE TABLE public.watchlist_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  watchlist_id uuid NOT NULL REFERENCES public.watchlist(id) ON DELETE CASCADE,
  tag text NOT NULL,
  CONSTRAINT tag_length CHECK (char_length(tag) <= 30)
);

-- Indexes
CREATE INDEX idx_watchlist_user ON public.watchlist(user_id);
CREATE INDEX idx_watchlist_player ON public.watchlist(player_id);
CREATE INDEX idx_watchlist_folders_user ON public.watchlist_folders(user_id);
CREATE INDEX idx_folder_players_folder ON public.watchlist_folder_players(folder_id);
CREATE INDEX idx_folder_players_watchlist ON public.watchlist_folder_players(watchlist_id);
CREATE INDEX idx_tags_watchlist ON public.watchlist_tags(watchlist_id);
CREATE INDEX idx_tags_user ON public.watchlist_tags(user_id);

-- RLS: watchlist
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlist" ON public.watchlist
  FOR ALL USING (auth.uid() = user_id);

-- RLS: watchlist_folders
ALTER TABLE public.watchlist_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own folders" ON public.watchlist_folders
  FOR ALL USING (auth.uid() = user_id);

-- RLS: watchlist_folder_players (via folder ownership)
ALTER TABLE public.watchlist_folder_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own folder assignments" ON public.watchlist_folder_players
  FOR ALL USING (
    folder_id IN (SELECT id FROM public.watchlist_folders WHERE user_id = auth.uid())
  );

-- RLS: watchlist_tags
ALTER TABLE public.watchlist_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tags" ON public.watchlist_tags
  FOR ALL USING (auth.uid() = user_id);

-- Migrate existing shortlist data to watchlist
INSERT INTO public.watchlist (user_id, player_id, notes, created_at)
SELECT scout_id, player_id, notes, created_at
FROM public.shortlists
WHERE scout_id IS NOT NULL AND player_id IS NOT NULL
ON CONFLICT (user_id, player_id) DO NOTHING;
