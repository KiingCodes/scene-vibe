-- Update vibe limit check to 20 minutes
CREATE OR REPLACE FUNCTION public.check_vibe_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.vibes 
    WHERE club_id = NEW.club_id 
    AND device_id = NEW.device_id 
    AND created_at > now() - interval '20 minutes'
  ) THEN
    RAISE EXCEPTION 'Already vibed this club in the last 20 minutes';
  END IF;
  RETURN NEW;
END;
$function$;