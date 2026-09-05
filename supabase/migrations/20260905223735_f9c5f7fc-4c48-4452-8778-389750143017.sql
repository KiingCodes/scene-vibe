ALTER TABLE public.venue_claims
  ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS role_position text,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

UPDATE public.clubs SET is_verified = true
WHERE status = 'approved' AND (owner_id IS NOT NULL OR verified_at IS NOT NULL);

DROP POLICY IF EXISTS "Users update own claims" ON public.venue_claims;
CREATE POLICY "Owners edit drafts, admins moderate"
ON public.venue_claims FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (auth.uid() = user_id AND status = 'draft')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (auth.uid() = user_id AND status IN ('draft', 'pending_approval'))
);

CREATE OR REPLACE FUNCTION public.apply_venue_claim_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_club_id uuid;
BEGIN
  IF NEW.status <> 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;

  SELECT id INTO target_club_id FROM public.clubs
  WHERE id = NEW.venue_id
     OR claim_id = NEW.id
     OR lower(name) = lower(NEW.venue_name)
  ORDER BY (id = NEW.venue_id) DESC, (claim_id = NEW.id) DESC
  LIMIT 1;

  IF target_club_id IS NULL AND NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    INSERT INTO public.clubs (name, address, area, lat, lng, phone, status, owner_id, claim_id, verified_at, is_verified)
    VALUES (
      NEW.venue_name,
      COALESCE(NEW.address, 'Unknown'),
      COALESCE(NULLIF(split_part(COALESCE(NEW.address, ''), ',', 2), ''), 'Unknown'),
      NEW.latitude, NEW.longitude, NEW.phone,
      'approved', NEW.user_id, NEW.id, now(), true
    );
  ELSIF target_club_id IS NOT NULL THEN
    UPDATE public.clubs
    SET status = 'approved',
        owner_id = NEW.user_id,
        claim_id = NEW.id,
        verified_at = now(),
        is_verified = true,
        phone = COALESCE(phone, NEW.phone),
        address = COALESCE(NULLIF(address, ''), NEW.address, address)
    WHERE id = target_club_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'venue_owner')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;