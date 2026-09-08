ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS live_status text,
  ADD COLUMN IF NOT EXISTS is_live boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cover_charge text,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.venue_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '6 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.venue_announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.venue_announcements TO authenticated;
GRANT ALL ON public.venue_announcements TO service_role;

ALTER TABLE public.venue_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read live announcements"
  ON public.venue_announcements FOR SELECT
  USING (expires_at > now());

CREATE POLICY "Owners and admins insert announcements"
  ON public.venue_announcements FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.owner_id = auth.uid())
    )
  );

CREATE POLICY "Owners and admins update announcements"
  ON public.venue_announcements FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.owner_id = auth.uid())
  );

CREATE POLICY "Owners and admins delete announcements"
  ON public.venue_announcements FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.owner_id = auth.uid())
  );

CREATE TRIGGER venue_announcements_updated_at
  BEFORE UPDATE ON public.venue_announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.clubs REPLICA IDENTITY FULL;
ALTER TABLE public.venue_announcements REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clubs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.venue_announcements;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;