ALTER TABLE public.venue_claims
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS document_name text;

CREATE POLICY "Owners upload claim docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'venue-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners and admins read claim docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'venue-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Owners and admins delete claim docs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'venue-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));