-- Per-user progress for individual exercise checklist items.
-- Exercise completion remains stored in student_progress.

CREATE TABLE student_checklist_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checklist_id UUID NOT NULL REFERENCES exercise_checklists(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, checklist_id)
);

CREATE INDEX idx_student_checklist_progress_user
    ON student_checklist_progress(user_id);
CREATE INDEX idx_student_checklist_progress_checklist
    ON student_checklist_progress(checklist_id);

ALTER TABLE student_checklist_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checklist progress"
ON student_checklist_progress FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own checklist progress"
ON student_checklist_progress FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own checklist progress"
ON student_checklist_progress FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own checklist progress"
ON student_checklist_progress FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE student_checklist_progress FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE student_checklist_progress TO authenticated;

ALTER TABLE student_progress
    ADD COLUMN IF NOT EXISTS submitted_scratch_url TEXT,
    ADD COLUMN IF NOT EXISTS submitted_scratch_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
