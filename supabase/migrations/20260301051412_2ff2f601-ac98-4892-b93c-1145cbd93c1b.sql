
-- Add community_added flag to clubs
ALTER TABLE public.clubs ADD COLUMN is_community_added boolean NOT NULL DEFAULT false;

-- Create pending_clubs table for submissions
CREATE TABLE public.pending_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  area text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  description text,
  image_url text,
  genre text,
  capacity text,
  opening_hours text,
  phone text,
  website text,
  instagram text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);

ALTER TABLE public.pending_clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view own pending submissions"
  ON public.pending_clubs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Auth users can submit spots"
  ON public.pending_clubs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
