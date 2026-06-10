
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'kiingncube@gmail.com' LIMIT 1;
  IF uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_badges (user_id, badge_type) VALUES (uid, 'regular') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_points (user_id, points, level)
      VALUES (uid, 500, 8)
      ON CONFLICT (user_id) DO UPDATE SET
        points = GREATEST(public.user_points.points, 500),
        level = GREATEST(public.user_points.level, 8),
        updated_at = now();
  END IF;
END $$;
