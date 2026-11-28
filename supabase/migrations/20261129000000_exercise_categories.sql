-- Many-to-many exercise <-> category.
--
-- exercises.category_id stays as the exercise's PRIMARY category (used by the
-- admin submissions view and the seed). This junction is the full membership
-- set that drives listing/filtering, so an exercise can belong to several
-- categories without duplicating the view or the seed.

CREATE TABLE IF NOT EXISTS exercise_categories (
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (exercise_id, category_id)
);

-- The PK already indexes (exercise_id, category_id); this covers category lookups.
CREATE INDEX IF NOT EXISTS idx_exercise_categories_category ON exercise_categories(category_id);

ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;

-- Categories are public, so membership of published exercises is public too.
CREATE POLICY "Exercise categories are viewable by everyone" ON exercise_categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exercises
            WHERE exercises.id = exercise_categories.exercise_id
            AND exercises.status = 'published'
        )
    );

CREATE POLICY "Admins can manage exercise categories" ON exercise_categories
    FOR ALL TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

GRANT SELECT ON exercise_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON exercise_categories TO authenticated;

-- Backfill existing single-category links.
INSERT INTO exercise_categories (exercise_id, category_id)
SELECT id, category_id FROM exercises WHERE category_id IS NOT NULL
ON CONFLICT (exercise_id, category_id) DO NOTHING;
