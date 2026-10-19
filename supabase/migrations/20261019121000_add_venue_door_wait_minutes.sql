ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS wait_time_minutes integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clubs_wait_time_minutes_range'
      AND conrelid = 'public.clubs'::regclass
  ) THEN
    ALTER TABLE public.clubs
      ADD CONSTRAINT clubs_wait_time_minutes_range
      CHECK (wait_time_minutes BETWEEN 0 AND 180);
  END IF;
END
$$;
