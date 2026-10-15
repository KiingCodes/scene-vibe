ALTER TABLE public.walk_sessions
  ADD COLUMN IF NOT EXISTS destination_lat double precision,
  ADD COLUMN IF NOT EXISTS destination_lng double precision;

DROP FUNCTION IF EXISTS public.get_public_walk_session(uuid);

CREATE FUNCTION public.get_public_walk_session(p_share_token uuid)
RETURNS TABLE (
  id uuid,
  status text,
  start_lat double precision,
  start_lng double precision,
  current_lat double precision,
  current_lng double precision,
  destination_name text,
  destination_lat double precision,
  destination_lng double precision,
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
    ws.destination_lat,
    ws.destination_lng,
    ws.eta_minutes,
    ws.created_at,
    ws.updated_at
  FROM public.walk_sessions AS ws
  WHERE ws.share_token = p_share_token;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_walk_session(uuid) TO anon, authenticated;
