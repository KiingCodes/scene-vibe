ALTER TABLE public.night_replays
 ADD COLUMN user_id uuid,
 ADD COLUMN venue_id uuid REFERENCES public.clubs(id),
 ADD COLUMN video_url text,
 ADD COLUMN caption text,
 ADD COLUMN views_count integer NOT NULL DEFAULT 0,
 ADD COLUMN status text NOT NULL DEFAULT 'pending',
 ADD COLUMN expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours');
ALTER TABLE public.night_replays ALTER COLUMN replay_date SET DEFAULT current_date;
ALTER TABLE public.night_replays DROP CONSTRAINT night_replays_replay_date_key;
CREATE UNIQUE INDEX night_replays_summary_date ON public.night_replays(replay_date) WHERE video_url IS NULL;
ALTER TABLE public.night_replays ADD CONSTRAINT night_replay_status_valid CHECK (status IN ('pending','approved','rejected'));
GRANT SELECT ON public.night_replays TO anon;
GRANT SELECT, INSERT, UPDATE ON public.night_replays TO authenticated;
GRANT ALL ON public.night_replays TO service_role;
ALTER TABLE public.night_replays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view replays" ON public.night_replays;
CREATE POLICY "Public active approved highlights" ON public.night_replays FOR SELECT TO anon, authenticated USING (video_url IS NOT NULL AND status='approved' AND expires_at > now());
CREATE POLICY "Submitters and reviewers read highlights" ON public.night_replays FOR SELECT TO authenticated USING (video_url IS NOT NULL AND (user_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id=venue_id AND c.owner_id=auth.uid())));
CREATE POLICY "Submit own highlights" ON public.night_replays FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND venue_id IS NOT NULL AND video_url IS NOT NULL AND (status='pending' OR (status='approved' AND (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id=venue_id AND c.owner_id=auth.uid())))));
CREATE POLICY "Venue owners and admins review highlights" ON public.night_replays FOR UPDATE TO authenticated USING (video_url IS NOT NULL AND (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id=venue_id AND c.owner_id=auth.uid()))) WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id=venue_id AND c.owner_id=auth.uid()));
REVOKE UPDATE ON public.night_replays FROM authenticated;
GRANT UPDATE(status) ON public.night_replays TO authenticated;
CREATE OR REPLACE FUNCTION public.validate_night_replay() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.video_url IS NULL THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.user_id IS NULL OR NEW.venue_id IS NULL THEN RAISE EXCEPTION 'Highlight requires a user and venue'; END IF;
  NEW.created_at := now(); NEW.expires_at := NEW.created_at + interval '72 hours'; NEW.views_count := 0;
  IF public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.clubs WHERE id=NEW.venue_id AND owner_id=auth.uid()) THEN NEW.status := 'approved'; ELSE NEW.status := 'pending'; END IF;
 ELSIF NEW.expires_at <= now() THEN RAISE EXCEPTION 'This highlight has expired';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER night_replay_validation BEFORE INSERT OR UPDATE ON public.night_replays FOR EACH ROW EXECUTE FUNCTION public.validate_night_replay();
CREATE INDEX night_replay_active_feed ON public.night_replays(status,created_at DESC) WHERE video_url IS NOT NULL;
CREATE INDEX night_replay_venue_review ON public.night_replays(venue_id,status);
CREATE POLICY "Upload own replay files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='night_replays' AND name ~ ('^replays/' || auth.uid()::text || '_[0-9]+[.]mp4$') AND lower(coalesce(metadata->>'mimetype','')) IN ('video/mp4','video/quicktime','video/webm'));
CREATE POLICY "Read authorized replay files" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id='night_replays' AND (owner_id=auth.uid()::text OR EXISTS (SELECT 1 FROM public.night_replays r WHERE r.video_url LIKE '%/night_replays/' || storage.objects.name AND ((r.status='approved' AND r.expires_at>now()) OR public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id=r.venue_id AND c.owner_id=auth.uid())))));
CREATE POLICY "Remove own replay files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='night_replays' AND owner_id=auth.uid()::text);
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='night_replays') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.night_replays; END IF; END $$;