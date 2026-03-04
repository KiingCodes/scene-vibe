
-- Club ratings table (DJ, music quality ratings) - one per user per club per day enforced at app level
CREATE TABLE public.club_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dj_rating integer NOT NULL CHECK (dj_rating >= 1 AND dj_rating <= 5),
  music_rating integer NOT NULL CHECK (music_rating >= 1 AND music_rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.club_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view club ratings" ON public.club_ratings FOR SELECT USING (true);
CREATE POLICY "Auth users can rate" ON public.club_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.club_ratings FOR UPDATE USING (auth.uid() = user_id);

-- User points table
CREATE TABLE public.user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  points integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view points" ON public.user_points FOR SELECT USING (true);
CREATE POLICY "Users can insert own points" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own points" ON public.user_points FOR UPDATE USING (auth.uid() = user_id);

-- User badges table
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users can earn badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for club_ratings
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_ratings;
