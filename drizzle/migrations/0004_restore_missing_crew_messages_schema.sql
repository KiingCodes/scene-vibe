CREATE TABLE IF NOT EXISTS public.crew_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(), crew_id uuid NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE, content text NOT NULL DEFAULT '', message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','replay_share','location_drop','venue_card')), metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT ON public.crew_messages TO authenticated;
GRANT ALL ON public.crew_messages TO service_role;
ALTER TABLE public.crew_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS crew_messages_crew_created_idx ON public.crew_messages(crew_id,created_at);
CREATE POLICY "Crew members can read crew messages" ON public.crew_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.crew_members m WHERE m.crew_id=crew_messages.crew_id AND m.user_id=auth.uid()));
CREATE POLICY "Crew members can send crew messages" ON public.crew_messages FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND EXISTS (SELECT 1 FROM public.crew_members m WHERE m.crew_id=crew_messages.crew_id AND m.user_id=auth.uid()));
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='crew_messages') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_messages; END IF; END $$;