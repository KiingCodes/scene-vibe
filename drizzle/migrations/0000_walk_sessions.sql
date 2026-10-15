CREATE TABLE public.walk_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled','panic_alert')),
  start_lat double precision NOT NULL,
  start_lng double precision NOT NULL,
  current_lat double precision,
  current_lng double precision,
  destination_name text,
  eta_minutes integer NOT NULL DEFAULT 30,
  share_token text NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text,'-',''),1,16),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  last_ping_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX walk_sessions_user_status_idx ON public.walk_sessions(user_id, status);

GRANT SELECT, INSERT, UPDATE ON public.walk_sessions TO authenticated;
GRANT ALL ON public.walk_sessions TO service_role;

ALTER TABLE public.walk_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own walks" ON public.walk_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users start own walks" ON public.walk_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own walks" ON public.walk_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.walk_sessions_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.current_lat IS DISTINCT FROM OLD.current_lat OR NEW.current_lng IS DISTINCT FROM OLD.current_lng THEN
    NEW.last_ping_at := now();
  END IF;
  IF NEW.status IN ('completed','cancelled') AND OLD.status NOT IN ('completed','cancelled') THEN
    NEW.ended_at := coalesce(NEW.ended_at, now());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER walk_sessions_touch BEFORE UPDATE ON public.walk_sessions FOR EACH ROW EXECUTE FUNCTION public.walk_sessions_touch();

-- Public tracking: token holders only, never a table-wide public read
CREATE OR REPLACE FUNCTION public.get_public_walk_session(p_share_token text)
RETURNS TABLE (id uuid, status text, start_lat double precision, start_lng double precision,
  current_lat double precision, current_lng double precision, destination_name text,
  eta_minutes integer, started_at timestamptz, ended_at timestamptz, last_ping_at timestamptz,
  created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, status, start_lat, start_lng, current_lat, current_lng, destination_name,
    eta_minutes, started_at, ended_at, last_ping_at, created_at, updated_at
  FROM public.walk_sessions
  WHERE share_token = p_share_token AND status <> 'cancelled'
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_public_walk_session(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_walk_session(text) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.walk_sessions;

-- emergency_contacts: add contact_name, kept in sync with legacy name
ALTER TABLE public.emergency_contacts ADD COLUMN contact_name text;
UPDATE public.emergency_contacts SET contact_name = name WHERE contact_name IS NULL;
CREATE OR REPLACE FUNCTION public.emergency_contacts_sync_name()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.contact_name := coalesce(NEW.contact_name, NEW.name);
  NEW.name := coalesce(NEW.name, NEW.contact_name);
  RETURN NEW;
END $$;
CREATE TRIGGER emergency_contacts_sync_name BEFORE INSERT OR UPDATE ON public.emergency_contacts FOR EACH ROW EXECUTE FUNCTION public.emergency_contacts_sync_name();
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;