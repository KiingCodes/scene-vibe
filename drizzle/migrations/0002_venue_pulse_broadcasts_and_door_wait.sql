ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS wait_time_minutes integer NOT NULL DEFAULT 15 CHECK (wait_time_minutes BETWEEN 0 AND 90);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.clubs(id), ADD COLUMN IF NOT EXISTS sender_name text, ADD COLUMN IF NOT EXISTS sender_type text NOT NULL DEFAULT 'user' CHECK (sender_type IN ('user','venue')), ADD COLUMN IF NOT EXISTS is_verified_venue boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS announcement_id uuid UNIQUE REFERENCES public.venue_announcements(id) ON DELETE CASCADE;
ALTER TABLE public.venue_announcements ADD COLUMN IF NOT EXISTS channel_id text NOT NULL DEFAULT 'live-clubs';
CREATE INDEX IF NOT EXISTS messages_channel_country_created_idx ON public.messages(channel_id,country,created_at DESC);
CREATE OR REPLACE FUNCTION public.validate_venue_message_sender() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE venue public.clubs%ROWTYPE;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.venue_id IS NOT DISTINCT FROM OLD.venue_id AND NEW.sender_type IS NOT DISTINCT FROM OLD.sender_type AND NEW.sender_name IS NOT DISTINCT FROM OLD.sender_name AND NEW.is_verified_venue IS NOT DISTINCT FROM OLD.is_verified_venue AND NEW.user_id IS NOT DISTINCT FROM OLD.user_id AND NEW.announcement_id IS NOT DISTINCT FROM OLD.announcement_id THEN RETURN NEW; END IF;
  IF NEW.sender_type = 'venue' OR NEW.venue_id IS NOT NULL OR NEW.is_verified_venue OR NEW.announcement_id IS NOT NULL THEN
    SELECT * INTO venue FROM public.clubs WHERE id = NEW.venue_id;
    IF NOT FOUND OR venue.status <> 'approved' OR NOT (venue.is_verified OR venue.verified_at IS NOT NULL OR venue.owner_id IS NOT NULL) THEN RAISE EXCEPTION 'Only approved, verified venues can broadcast'; END IF;
    IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid() OR NOT (venue.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) IS TRUE THEN RAISE EXCEPTION 'Only the venue owner or an admin can broadcast' USING ERRCODE = '42501'; END IF;
    IF NEW.announcement_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.venue_announcements a WHERE a.id = NEW.announcement_id AND a.club_id = venue.id AND a.user_id = NEW.user_id AND a.content = NEW.content AND a.channel_id = NEW.channel_id) THEN RAISE EXCEPTION 'Invalid announcement source'; END IF;
    NEW.sender_type := 'venue'; NEW.sender_name := venue.name; NEW.is_verified_venue := true; NEW.country := venue.country; NEW.club_id := NULL;
  ELSE
    NEW.sender_name := NULL; NEW.sender_type := 'user'; NEW.is_verified_venue := false;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER messages_validate_venue_sender BEFORE INSERT OR UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.validate_venue_message_sender();
CREATE OR REPLACE FUNCTION public.broadcast_venue_announcement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.messages (user_id,venue_id,announcement_id,channel_id,content,sender_type,created_at)
  VALUES (NEW.user_id,NEW.club_id,NEW.id,NEW.channel_id,NEW.content,'venue',NEW.created_at);
  RETURN NEW;
END; $$;
CREATE TRIGGER venue_announcements_broadcast AFTER INSERT ON public.venue_announcements FOR EACH ROW EXECUTE FUNCTION public.broadcast_venue_announcement();
REVOKE ALL ON FUNCTION public.validate_venue_message_sender() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.broadcast_venue_announcement() FROM PUBLIC,anon,authenticated;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; END IF;
END $$;