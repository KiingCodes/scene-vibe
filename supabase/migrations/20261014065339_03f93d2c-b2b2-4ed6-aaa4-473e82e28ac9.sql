ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS channel_id text NOT NULL DEFAULT 'global';
CREATE INDEX IF NOT EXISTS messages_channel_created_idx ON public.messages (country, channel_id, created_at DESC) WHERE club_id IS NULL;

CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
CREATE INDEX message_reactions_message_idx ON public.message_reactions (message_id);

GRANT SELECT ON public.message_reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions are viewable by everyone" ON public.message_reactions
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users add their own reactions" ON public.message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND emoji IN ('🔥','🎧','🍾','⚡'));
CREATE POLICY "Users remove their own reactions" ON public.message_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;