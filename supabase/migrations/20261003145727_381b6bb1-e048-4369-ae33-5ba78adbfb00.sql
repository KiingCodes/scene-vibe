ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_notifications boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS walk_me_home_privacy text NOT NULL DEFAULT 'contacts',
  ADD COLUMN IF NOT EXISTS sound_effects boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_profile_visibility_check CHECK (profile_visibility IN ('public','followers','private')),
  ADD CONSTRAINT profiles_walk_privacy_check CHECK (walk_me_home_privacy IN ('contacts','private'));