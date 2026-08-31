CREATE TABLE public.safety_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','escalated')),
  current_lat double precision,
  current_lng double precision,
  destination_lat double precision NOT NULL,
  destination_lng double precision NOT NULL,
  destination_label text,
  battery_level integer,
  eta_minutes integer NOT NULL DEFAULT 30,
  last_ping_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '4 hours'),
  duress_flagged boolean NOT NULL DEFAULT false,
  escalated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_safety_sessions_user ON public.safety_sessions(user_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_sessions TO authenticated;
GRANT SELECT ON public.safety_sessions TO anon;
GRANT ALL ON public.safety_sessions TO service_role;

ALTER TABLE public.safety_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own safety sessions"
  ON public.safety_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone with the link can view a live session"
  ON public.safety_sessions FOR SELECT TO anon, authenticated
  USING (expires_at > now());

CREATE TABLE public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_emergency_contacts_user ON public.emergency_contacts(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own emergency contacts"
  ON public.emergency_contacts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER safety_sessions_set_updated_at
  BEFORE UPDATE ON public.safety_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER emergency_contacts_set_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.safety_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_sessions;