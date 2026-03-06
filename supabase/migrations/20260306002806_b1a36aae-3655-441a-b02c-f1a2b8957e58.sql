
-- Crews table
CREATE TABLE public.crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  invite_code TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(6), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crews" ON public.crews FOR SELECT USING (true);
CREATE POLICY "Auth users can create crews" ON public.crews FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update crew" ON public.crews FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete crew" ON public.crews FOR DELETE USING (auth.uid() = created_by);

-- Crew members
CREATE TABLE public.crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(crew_id, user_id)
);

ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crew members" ON public.crew_members FOR SELECT USING (true);
CREATE POLICY "Auth users can join crews" ON public.crew_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members can leave" ON public.crew_members FOR DELETE USING (auth.uid() = user_id);

-- Crew votes (vote where to go tonight)
CREATE TABLE public.crew_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  club_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(crew_id, user_id)
);

ALTER TABLE public.crew_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crew votes" ON public.crew_votes FOR SELECT USING (true);
CREATE POLICY "Auth users can vote" ON public.crew_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change vote" ON public.crew_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove vote" ON public.crew_votes FOR DELETE USING (auth.uid() = user_id);

-- Events (promoter posts)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL,
  promoter_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  image_url TEXT,
  is_boosted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Auth users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = promoter_id);
CREATE POLICY "Promoter can update event" ON public.events FOR UPDATE USING (auth.uid() = promoter_id);
CREATE POLICY "Promoter can delete event" ON public.events FOR DELETE USING (auth.uid() = promoter_id);

-- Promotions / boost requests (payment-based)
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'club_boost',
  target_id UUID NOT NULL,
  bank_reference TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own promotions" ON public.promotions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all promotions" ON public.promotions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Auth users can request promotions" ON public.promotions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update promotions" ON public.promotions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for chat media
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true);

CREATE POLICY "Auth users can upload chat media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-media' AND auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view chat media" ON storage.objects FOR SELECT USING (bucket_id = 'chat-media');

-- Add media_url to messages for sharing media in chat
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Enable realtime for crews and crew_votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.crews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
