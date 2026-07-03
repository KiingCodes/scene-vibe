
CREATE OR REPLACE FUNCTION public.check_vibe_user_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.vibes
    WHERE user_id = NEW.user_id
      AND created_at > now() - interval '30 minutes'
  ) THEN
    RAISE EXCEPTION 'You can only vibe one club every 30 minutes';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vibe_user_limit ON public.vibes;
CREATE TRIGGER vibe_user_limit
BEFORE INSERT ON public.vibes
FOR EACH ROW EXECUTE FUNCTION public.check_vibe_user_limit();
