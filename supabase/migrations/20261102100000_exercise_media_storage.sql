INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-assets',
  'exercise-assets',
  true,
  52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/ogg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Admin can upload exercise assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exercise-assets' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin can update exercise assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'exercise-assets' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK (bucket_id = 'exercise-assets' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin can delete exercise assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'exercise-assets' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');