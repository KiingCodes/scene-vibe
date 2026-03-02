
-- Favorites table for saving clubs
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, club_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Night plans table
CREATE TABLE public.night_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Tonight''s Plan',
  share_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(share_token)
);

ALTER TABLE public.night_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans" ON public.night_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view shared plans" ON public.night_plans FOR SELECT USING (true);
CREATE POLICY "Users can create plans" ON public.night_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.night_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.night_plans FOR DELETE USING (auth.uid() = user_id);

-- Night plan items (clubs in a plan with order)
CREATE TABLE public.night_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.night_plans(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.night_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plan items via plan" ON public.night_plan_items FOR SELECT USING (true);
CREATE POLICY "Users can add plan items" ON public.night_plan_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.night_plans WHERE id = plan_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update plan items" ON public.night_plan_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.night_plans WHERE id = plan_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete plan items" ON public.night_plan_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.night_plans WHERE id = plan_id AND user_id = auth.uid())
);
