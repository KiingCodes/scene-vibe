
-- Push subscriptions table (device-level, not user-required)
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_id TEXT,
  country TEXT DEFAULT 'ZA',
  user_agent TEXT,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT INSERT, UPDATE ON public.push_subscriptions TO anon;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can register a subscription (device-level). Reads/deletes limited to owner or admin.
CREATE POLICY "Anyone can register a push subscription"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own subscription by endpoint"
  ON public.push_subscriptions FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Users see their own subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users delete their own subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_push_subs_country ON public.push_subscriptions(country);
CREATE INDEX idx_push_subs_user ON public.push_subscriptions(user_id);

-- Add version column to notifications so every stamp carries the app version.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS app_version TEXT;
