ALTER TABLE public.videos
  ADD COLUMN replay_status TEXT NOT NULL DEFAULT 'approved'
  CHECK (replay_status IN ('pending', 'approved', 'rejected'));

DROP POLICY IF EXISTS "Anyone can view videos" ON public.videos;

CREATE POLICY "Anyone can view approved replay videos"
  ON public.videos FOR SELECT
  USING (replay_status = 'approved');

CREATE POLICY "Submitters can view own replay submissions"
  ON public.videos FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Venue owners can view replay submissions"
  ON public.videos FOR SELECT TO authenticated
  USING (
    replay_status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = videos.club_id AND clubs.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view replay submissions"
  ON public.videos FOR SELECT TO authenticated
  USING (
    replay_status = 'pending'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Auth users can post videos" ON public.videos;

CREATE POLICY "Auth users can submit replay videos"
  ON public.videos FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND club_id IS NOT NULL
    AND replay_status = 'pending'
  );

DROP POLICY IF EXISTS "Users can update own videos" ON public.videos;

CREATE OR REPLACE FUNCTION public.review_night_replay_submission(
  _video_id UUID,
  _status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR _status IS NULL OR _status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid replay review request';
  END IF;

  UPDATE public.videos
  SET replay_status = _status
  WHERE id = _video_id
    AND replay_status = 'pending'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.clubs
        WHERE clubs.id = videos.club_id AND clubs.owner_id = auth.uid()
      )
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Replay submission not found or review not authorized';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.review_night_replay_submission(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_night_replay_submission(UUID, TEXT) TO authenticated;
