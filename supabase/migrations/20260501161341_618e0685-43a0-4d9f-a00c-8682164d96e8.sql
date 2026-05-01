ALTER TABLE public.messages ALTER COLUMN club_id DROP NOT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS flag_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.message_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

ALTER TABLE public.message_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can flag" ON public.message_flags
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own flags" ON public.message_flags
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all flags" ON public.message_flags
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update messages" ON public.messages
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete messages" ON public.messages
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.bump_message_flag_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.messages
  SET flag_count = flag_count + 1,
      is_hidden = CASE WHEN flag_count + 1 >= 3 THEN true ELSE is_hidden END
  WHERE id = NEW.message_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_message_flag_count ON public.message_flags;
CREATE TRIGGER trg_bump_message_flag_count
AFTER INSERT ON public.message_flags
FOR EACH ROW
EXECUTE FUNCTION public.bump_message_flag_count();