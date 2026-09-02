ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'venue_owner';

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS owner_id uuid,
  ADD COLUMN IF NOT EXISTS claim_id uuid REFERENCES public.venue_claims(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

CREATE INDEX IF NOT EXISTS clubs_status_idx ON public.clubs (status);
CREATE INDEX IF NOT EXISTS clubs_owner_idx ON public.clubs (owner_id);

GRANT SELECT ON public.clubs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.clubs TO authenticated;
GRANT ALL ON public.clubs TO service_role;

DROP POLICY IF EXISTS "Clubs viewable by everyone" ON public.clubs;
CREATE POLICY "Approved clubs are public"
ON public.clubs FOR SELECT
USING (
  status = 'approved'
  OR owner_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Owners and admins can update clubs" ON public.clubs;
CREATE POLICY "Owners and admins can update clubs"
ON public.clubs FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.apply_venue_claim_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_club_id uuid;
BEGIN
  IF NEW.status <> 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO target_club_id FROM public.clubs
  WHERE claim_id = NEW.id
     OR lower(name) = lower(NEW.venue_name)
  ORDER BY (claim_id = NEW.id) DESC
  LIMIT 1;

  IF target_club_id IS NULL AND NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    INSERT INTO public.clubs (name, address, area, lat, lng, phone, status, owner_id, claim_id, verified_at)
    VALUES (
      NEW.venue_name,
      COALESCE(NEW.address, 'Unknown'),
      COALESCE(NULLIF(split_part(COALESCE(NEW.address, ''), ',', 2), ''), 'Unknown'),
      NEW.latitude, NEW.longitude, NEW.phone,
      'approved', NEW.user_id, NEW.id, now()
    );
  ELSIF target_club_id IS NOT NULL THEN
    UPDATE public.clubs
    SET status = 'approved',
        owner_id = NEW.user_id,
        claim_id = NEW.id,
        verified_at = now(),
        phone = COALESCE(phone, NEW.phone),
        address = COALESCE(NULLIF(address, ''), NEW.address, address)
    WHERE id = target_club_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'venue_owner')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_venue_claim_approval ON public.venue_claims;
CREATE TRIGGER trg_apply_venue_claim_approval
AFTER UPDATE ON public.venue_claims
FOR EACH ROW EXECUTE FUNCTION public.apply_venue_claim_approval();

ALTER TABLE public.clubs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clubs;