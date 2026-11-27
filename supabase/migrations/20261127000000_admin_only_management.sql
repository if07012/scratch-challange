-- Restrict content management to admins (auth app_metadata role = 'admin').
-- Public read access to published content is unchanged.
--
-- Bootstrap the first admin once (replace the email), then log in again so the
-- JWT picks up the new app_metadata:
--   UPDATE auth.users
--   SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
--   WHERE email = 'admin@example.com';

DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can manage exercises" ON exercises;
DROP POLICY IF EXISTS "Authenticated users can manage checklists" ON exercise_checklists;

CREATE POLICY "Admins can manage categories"
ON categories FOR ALL TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can manage exercises"
ON exercises FOR ALL TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can manage checklists"
ON exercise_checklists FOR ALL TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Authenticated users can upload exercise assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update exercise assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete exercise assets" ON storage.objects;

CREATE POLICY "Admins can upload exercise assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exercise-assets' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update exercise assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'exercise-assets' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK (bucket_id = 'exercise-assets' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete exercise assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'exercise-assets' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
