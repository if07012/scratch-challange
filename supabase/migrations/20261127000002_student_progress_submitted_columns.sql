-- Re-apply the student submission columns that never reached the remote DB.
-- 20261106000000 added them but the table already existed remotely without them.
-- Idempotent: safe to run more than once.

ALTER TABLE student_progress
    ADD COLUMN IF NOT EXISTS submitted_scratch_url TEXT,
    ADD COLUMN IF NOT EXISTS submitted_scratch_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

-- Make PostgREST pick up the new columns immediately.
NOTIFY pgrst, 'reload schema';

-- Verify (expect 4 columns including the 3 above besides core fields):
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'student_progress' ORDER BY ordinal_position;
