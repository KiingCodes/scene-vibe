CREATE TABLE public.sponsorship_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  title text NOT NULL,
  asset_type text NOT NULL DEFAULT 'Hero Carousel Banner',
  budget_cents integer NOT NULL DEFAULT 0,
  spent_cents integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  redemptions integer NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  venues text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'scheduled',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sponsorship_campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsorship_campaigns TO authenticated;
GRANT ALL ON public.sponsorship_campaigns TO service_role;
ALTER TABLE public.sponsorship_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Campaigns are viewable by everyone" ON public.sponsorship_campaigns FOR SELECT USING (true);
CREATE POLICY "Admins manage campaigns insert" ON public.sponsorship_campaigns FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage campaigns update" ON public.sponsorship_campaigns FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage campaigns delete" ON public.sponsorship_campaigns FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER sponsorship_campaigns_updated_at BEFORE UPDATE ON public.sponsorship_campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sponsorship_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.sponsorship_campaigns(id) ON DELETE CASCADE,
  user_id uuid,
  venue_name text,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.sponsorship_redemptions TO authenticated;
GRANT ALL ON public.sponsorship_redemptions TO service_role;
ALTER TABLE public.sponsorship_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own redemptions" ON public.sponsorship_redemptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own redemptions" ON public.sponsorship_redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.venue_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid UNIQUE REFERENCES public.venue_claims(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  venue_name text NOT NULL,
  tier text NOT NULL DEFAULT 'basic',
  status text NOT NULL DEFAULT 'pending',
  verified boolean NOT NULL DEFAULT false,
  renews_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.venue_subscriptions TO authenticated;
GRANT ALL ON public.venue_subscriptions TO service_role;
ALTER TABLE public.venue_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins view subscriptions" ON public.venue_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners create own subscription" ON public.venue_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners and admins update subscriptions" ON public.venue_subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER venue_subscriptions_updated_at BEFORE UPDATE ON public.venue_subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable by everyone" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins insert settings" ON public.platform_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update settings" ON public.platform_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.platform_settings (key, value) VALUES ('fees', '{"linePassFee":15,"ticketFee":7}') ON CONFLICT (key) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'kiingncube@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;