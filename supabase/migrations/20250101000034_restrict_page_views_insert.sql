-- Restrict page_views INSERT to authenticated users only.
-- Previously allowed unauthenticated inserts (with check (true)).

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;

CREATE POLICY "Authenticated users can insert page views"
  ON public.page_views FOR INSERT
  TO authenticated
  WITH CHECK (true);
