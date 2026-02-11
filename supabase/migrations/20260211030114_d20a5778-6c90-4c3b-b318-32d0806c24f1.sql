
-- Create pulling_up table
CREATE TABLE public.pulling_up (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  eta_minutes INTEGER NOT NULL DEFAULT 30,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pulling_up ENABLE ROW LEVEL SECURITY;

-- Anyone can read pulling_up counts
CREATE POLICY "Anyone can view pulling_up" ON public.pulling_up FOR SELECT USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert pulling_up" ON public.pulling_up FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pulling_up;

-- Limit one active pulling_up per device per club
CREATE OR REPLACE FUNCTION public.check_pulling_up_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.pulling_up
    WHERE club_id = NEW.club_id
    AND device_id = NEW.device_id
    AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Already pulling up to this club';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_pulling_up_limit_trigger
BEFORE INSERT ON public.pulling_up
FOR EACH ROW
EXECUTE FUNCTION public.check_pulling_up_limit();
