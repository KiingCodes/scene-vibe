CREATE TABLE public.walk_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'alert')),
  start_lat double precision NOT NULL,
  start_lng double precision NOT NULL,
  current_lat double precision,
  current_lng double precision,
  destination_name text NOT NULL,
  eta_minutes integer NOT NULL DEFAULT 30 CHECK (eta_minutes > 0),
  share_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX walk_sessions_user_status_idx ON public.walk_sessions(user_id, status);

ALTER TABLE public.walk_sessions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.walk_sessions TO authenticated;

CREATE POLICY "Users manage their own walk sessions"
  ON public.walk_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER walk_sessions_set_updated_at
  BEFORE UPDATE ON public.walk_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_public_walk_session(p_share_token uuid)
RETURNS TABLE (
  id uuid,
  status text,
  start_lat double precision,
  start_lng double precision,
  current_lat double precision,
  current_lng double precision,
  destination_name text,
  eta_minutes integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ws.id,
    ws.status,
    ws.start_lat,
    ws.start_lng,
    ws.current_lat,
    ws.current_lng,
    ws.destination_name,
    ws.eta_minutes,
    ws.created_at,
    ws.updated_at
  FROM public.walk_sessions AS ws
  WHERE ws.share_token = p_share_token;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_walk_session(uuid) TO anon, authenticated;
