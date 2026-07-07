
-- =========================
-- Venue claims (onboarding)
-- =========================
CREATE TABLE IF NOT EXISTS public.venue_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  venue_name TEXT NOT NULL,
  legal_name TEXT,
  email TEXT,
  phone TEXT,
  tags TEXT[] DEFAULT '{}',
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  radius_m INTEGER DEFAULT 100,
  geofence_verified BOOLEAN DEFAULT FALSE,
  verification_method TEXT DEFAULT 'pending', -- 'document' | 'otp' | 'pending'
  document_url TEXT,
  otp_verified BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'submitted' | 'approved' | 'rejected'
  step INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.venue_claims TO authenticated;
GRANT ALL ON public.venue_claims TO service_role;

ALTER TABLE public.venue_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own claims"
  ON public.venue_claims FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own claims"
  ON public.venue_claims FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own claims"
  ON public.venue_claims FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER venue_claims_updated_at
  BEFORE UPDATE ON public.venue_claims
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- OTP challenges (server-only)
-- =========================
CREATE TABLE IF NOT EXISTS public.otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES public.venue_claims(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '10 minutes',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.otp_challenges TO service_role;

ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;
-- No policies for authenticated → only service_role (edge functions) can touch it.
