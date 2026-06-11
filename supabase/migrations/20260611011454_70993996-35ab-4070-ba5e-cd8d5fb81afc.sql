
CREATE TABLE public.experience_attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('checkin','going','interested')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.experience_attendances TO authenticated;
GRANT SELECT ON public.experience_attendances TO anon;
GRANT ALL ON public.experience_attendances TO service_role;

ALTER TABLE public.experience_attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attendances"
  ON public.experience_attendances FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert their own attendance"
  ON public.experience_attendances FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete their own attendance"
  ON public.experience_attendances FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_exp_att_exp_type_created ON public.experience_attendances (experience_id, type, created_at DESC);
CREATE INDEX idx_exp_att_device ON public.experience_attendances (device_id, experience_id, type, created_at DESC);

-- Anti-fake rate limit: one entry per device per experience per type every 30 minutes
CREATE OR REPLACE FUNCTION public.check_experience_attendance_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.experience_attendances
    WHERE experience_id = NEW.experience_id
      AND device_id = NEW.device_id
      AND type = NEW.type
      AND created_at > now() - interval '30 minutes'
  ) THEN
    RAISE EXCEPTION 'Already marked % for this experience in the last 30 minutes', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_experience_attendance_limit
BEFORE INSERT ON public.experience_attendances
FOR EACH ROW EXECUTE FUNCTION public.check_experience_attendance_limit();

ALTER PUBLICATION supabase_realtime ADD TABLE public.experience_attendances;
