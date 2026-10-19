DROP POLICY IF EXISTS "Auth users can create events" ON public.events;
DROP POLICY IF EXISTS "Promoter can update event" ON public.events;
DROP POLICY IF EXISTS "Promoter can delete event" ON public.events;

CREATE POLICY "Promoters and venue owners can create events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = promoter_id
    AND (
      club_id IS NULL
      OR public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.clubs c
        WHERE c.id = events.club_id
          AND c.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Promoters venue owners and admins can update events"
  ON public.events FOR UPDATE TO authenticated
  USING (
    (club_id IS NULL AND auth.uid() = promoter_id)
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.clubs c
      WHERE c.id = events.club_id
        AND c.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    (club_id IS NULL AND auth.uid() = promoter_id)
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.clubs c
      WHERE c.id = events.club_id
        AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Promoters venue owners and admins can delete events"
  ON public.events FOR DELETE TO authenticated
  USING (
    (club_id IS NULL AND auth.uid() = promoter_id)
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.clubs c
      WHERE c.id = events.club_id
        AND c.owner_id = auth.uid()
    )
  );
