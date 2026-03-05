
-- Update vibe limit check to be GLOBAL per device (not per club)
CREATE OR REPLACE FUNCTION public.check_vibe_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.vibes 
    WHERE device_id = NEW.device_id 
    AND created_at > now() - interval '30 minutes'
  ) THEN
    RAISE EXCEPTION 'You can only vibe one club every 30 minutes';
  END IF;
  RETURN NEW;
END;
$function$;
