-- Admins need write access to any student's progress so the /api/submissions
-- DELETE route can clear another user's submission columns.
-- Admin policies on student_progress were dropped in
-- 20261105200000_authenticated_full_access.sql and never restored.

CREATE POLICY "Admins can manage student progress"
ON student_progress FOR ALL TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

NOTIFY pgrst, 'reload schema';
