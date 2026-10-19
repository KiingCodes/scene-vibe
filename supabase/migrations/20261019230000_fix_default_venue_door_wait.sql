ALTER TABLE public.clubs
  ALTER COLUMN wait_time_minutes SET DEFAULT 0;

UPDATE public.clubs
SET wait_time_minutes = 0
WHERE wait_time_minutes = 15
  AND owner_id IS NULL;
