
-- Crew location sharing
CREATE TABLE public.crew_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(crew_id, user_id)
);
ALTER TABLE public.crew_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Crew members can view locations" ON public.crew_locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.crew_members WHERE crew_members.crew_id = crew_locations.crew_id AND crew_members.user_id = auth.uid())
);
CREATE POLICY "Users can upsert own location" ON public.crew_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own location" ON public.crew_locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own location" ON public.crew_locations FOR DELETE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_locations;

-- Videos feature
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  video_url TEXT NOT NULL,
  caption TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Auth users can post videos" ON public.videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON public.videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own videos" ON public.videos FOR DELETE USING (auth.uid() = user_id);

-- Video views tracking
CREATE TABLE public.video_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(video_id, device_id)
);
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view video_views" ON public.video_views FOR SELECT USING (true);
CREATE POLICY "Anyone can insert video_views" ON public.video_views FOR INSERT WITH CHECK (true);

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_video_view()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.videos SET view_count = view_count + 1 WHERE id = NEW.video_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_video_view_insert
AFTER INSERT ON public.video_views
FOR EACH ROW EXECUTE FUNCTION public.increment_video_view();

-- Night replays
CREATE TABLE public.night_replays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  replay_date DATE NOT NULL UNIQUE,
  total_vibes INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  top_club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  top_club_name TEXT,
  peak_hour INTEGER,
  data_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.night_replays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view replays" ON public.night_replays FOR SELECT USING (true);

-- Storage bucket for videos
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('videos', 'videos', true, 104857600)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Anyone can view videos storage" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Auth users can upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own videos storage" ON storage.objects FOR DELETE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
