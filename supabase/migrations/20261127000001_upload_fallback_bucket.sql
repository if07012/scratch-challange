-- Fallback storage when Google Drive is not configured or fails.
-- Public read (same as Drive uploads, which grant reader/anyone), authenticated upload.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('uploads', 'uploads', true, 104857600)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

CREATE POLICY "Authenticated users can upload fallback files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uploads' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "Fallback files are readable"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'uploads');

CREATE POLICY "Owners can delete fallback files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
