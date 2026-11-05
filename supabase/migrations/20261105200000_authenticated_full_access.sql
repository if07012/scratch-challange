-- Replace role-specific database access with authenticated-user access.
-- RLS remains enabled, so anonymous users cannot use mutation operations.

DROP POLICY IF EXISTS "Admin full access to exercises" ON exercises;
DROP POLICY IF EXISTS "Admin full access to checklists" ON exercise_checklists;
DROP POLICY IF EXISTS "Admin full access to progress" ON student_progress;
DROP POLICY IF EXISTS "Admin can upload exercise assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update exercise assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete exercise assets" ON storage.objects;

CREATE POLICY "Authenticated users can manage categories"
ON categories FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage exercises"
ON exercises FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage checklists"
ON exercise_checklists FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can upload exercise assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exercise-assets');

CREATE POLICY "Authenticated users can update exercise assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'exercise-assets')
WITH CHECK (bucket_id = 'exercise-assets');

CREATE POLICY "Authenticated users can delete exercise assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'exercise-assets');
