
-- Helper for updated_at (create if missing)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- EVENTS extensions
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'party',
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS end_date timestamptz,
  ADD COLUMN IF NOT EXISTS price_info text,
  ADD COLUMN IF NOT EXISTS ticket_url text,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

ALTER TABLE public.events ALTER COLUMN club_id DROP NOT NULL;

-- EXPERIENCES table
CREATE TABLE IF NOT EXISTS public.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'workshop',
  description text,
  area text NOT NULL,
  address text,
  lat double precision,
  lng double precision,
  image_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_date timestamptz,
  end_date timestamptz,
  recurrence text,
  price_info text,
  registration_url text,
  opening_hours text,
  phone text,
  website text,
  instagram text,
  is_community_added boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'approved',
  created_by uuid,
  source_url text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved experiences viewable" ON public.experiences
  FOR SELECT USING (status = 'approved' OR auth.uid() = created_by OR has_role(auth.uid(),'admin'));
CREATE POLICY "Auth users submit experiences" ON public.experiences
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator updates own experience" ON public.experiences
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Admins update any experience" ON public.experiences
  FOR UPDATE USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete experiences" ON public.experiences
  FOR DELETE USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_experiences_updated_at
BEFORE UPDATE ON public.experiences
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='notifications') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='messages') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END $$;

-- Fanout community message -> notifications
CREATE OR REPLACE FUNCTION public.notify_community_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sender_name text;
BEGIN
  IF NEW.club_id IS NOT NULL THEN RETURN NEW; END IF;
  SELECT COALESCE(username,'Someone') INTO sender_name FROM public.profiles WHERE user_id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, meta)
  SELECT p.user_id, 'chat_message',
         sender_name || ' in Community Chat',
         LEFT(COALESCE(NEW.content,'[media]'),120),
         '/chat',
         jsonb_build_object('message_id', NEW.id, 'sender_id', NEW.user_id)
    FROM public.profiles p WHERE p.user_id <> NEW.user_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_community_message ON public.messages;
CREATE TRIGGER trg_notify_community_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_community_message();
