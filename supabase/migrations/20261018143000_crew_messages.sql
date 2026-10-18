CREATE TABLE public.crew_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  message_type TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'replay_share', 'location_drop', 'venue_card')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX crew_messages_crew_created_idx
  ON public.crew_messages (crew_id, created_at);

ALTER TABLE public.crew_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crew members can read crew messages"
  ON public.crew_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.crew_members
      WHERE crew_members.crew_id = crew_messages.crew_id
        AND crew_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Crew members can send crew messages"
  ON public.crew_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.crew_members
      WHERE crew_members.crew_id = crew_messages.crew_id
        AND crew_members.user_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_messages;
