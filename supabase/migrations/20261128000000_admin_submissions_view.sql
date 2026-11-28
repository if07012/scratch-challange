-- Admin page: student submissions/progress per exercise, with the student's email.
--
-- auth.users is not reachable through PostgREST, so the view reads it with the
-- definer's rights. The WHERE clause is the authorization boundary: rows are
-- only returned to callers whose JWT carries app_metadata.role = 'admin'.
-- ponytail: security-definer view guarded by the JWT claim (Supabase's documented
-- pattern). Move to an RPC with an explicit role check if the linter starts
-- flagging it.

CREATE OR REPLACE VIEW admin_student_submissions AS
SELECT
    sp.user_id,
    u.email,
    sp.exercise_id,
    e.title AS exercise_title,
    e.slug AS exercise_slug,
    e.category_id,
    sp.status,
    sp.submitted_scratch_url,
    sp.submitted_scratch_name,
    sp.submitted_at,
    sp.created_at,
    (SELECT count(*)
       FROM student_checklist_progress scp
       JOIN exercise_checklists ec ON ec.id = scp.checklist_id
      WHERE scp.user_id = sp.user_id
        AND ec.exercise_id = sp.exercise_id) AS checklist_done,
    (SELECT count(*) FROM exercise_checklists ec WHERE ec.exercise_id = sp.exercise_id) AS checklist_total
FROM student_progress sp
JOIN auth.users u ON u.id = sp.user_id
JOIN exercises e ON e.id = sp.exercise_id
WHERE (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';

REVOKE ALL ON admin_student_submissions FROM anon;
GRANT SELECT ON admin_student_submissions TO authenticated;

NOTIFY pgrst, 'reload schema';

-- Verify (as an admin JWT): expect one row per student/exercise pair.
-- SELECT exercise_title, email, submitted_scratch_name, submitted_at
-- FROM admin_student_submissions ORDER BY submitted_at DESC NULLS LAST;
