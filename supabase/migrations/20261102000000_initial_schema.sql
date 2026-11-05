-- Scratch Challenge Database Schema
-- Based on PRD requirements for Indonesian Scratch learning platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50), -- Lucide icon name
    color_class VARCHAR(50), -- Tailwind color class for UI
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: exercises
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    short_description TEXT,
    case_description TEXT, -- Full HTML content for case description
    problem_statement TEXT,
    instructions JSONB DEFAULT '[]'::jsonb, -- Array of instruction steps
    learning_objectives JSONB DEFAULT '[]'::jsonb, -- Array of learning objectives
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_minutes INTEGER DEFAULT 30,
    thumbnail_url TEXT,
    scratch_file_url TEXT,
    scratch_file_name VARCHAR(200),
    scratch_file_type VARCHAR(20) DEFAULT 'starter' CHECK (scratch_file_type IN ('starter', 'partial', 'blank')),
    video_url TEXT,
    video_type VARCHAR(20) DEFAULT 'youtube' CHECK (video_type IN ('youtube', 'external')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: exercise_checklists
CREATE TABLE exercise_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: student_progress (optional for MVP)
CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References auth.users
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, exercise_id)
);

-- Indexes for performance
CREATE INDEX idx_exercises_category ON exercises(category_id);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX idx_exercises_status ON exercises(status);
CREATE INDEX idx_exercises_slug ON exercises(slug);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_checklists_exercise ON exercise_checklists(exercise_id);
CREATE INDEX idx_student_progress_user ON student_progress(user_id);
CREATE INDEX idx_student_progress_exercise ON student_progress(exercise_id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categories: Public read access for published exercises
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

-- Exercises: Public read access for published exercises only
CREATE POLICY "Published exercises are viewable by everyone" ON exercises
    FOR SELECT USING (status = 'published');

-- Admin full access to exercises (using auth.jwt() ->> 'role' = 'admin')
-- Note: We'll use app_metadata for admin role
CREATE POLICY "Admin full access to exercises" ON exercises
    FOR ALL USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
    )
    WITH CHECK (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
    );

-- Exercise checklists: Public read for published exercises
CREATE POLICY "Checklists viewable for published exercises" ON exercise_checklists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exercises
            WHERE exercises.id = exercise_checklists.exercise_id
            AND exercises.status = 'published'
        )
    );

-- Admin full access to checklists
CREATE POLICY "Admin full access to checklists" ON exercise_checklists
    FOR ALL USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
    )
    WITH CHECK (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
    );

-- Student progress: Users can only see/update their own progress
CREATE POLICY "Users can view own progress" ON student_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON student_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON student_progress
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admin full access to student progress
CREATE POLICY "Admin full access to progress" ON student_progress
    FOR ALL USING (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
    )
    WITH CHECK (
        (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
    );

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();