export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  icon_name: string | null
  color_class: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type Exercise = {
  id: string
  category_id: string | null
  /** Primary category (category_id), then the rest from exercise_categories. */
  category_ids: string[]
  title: string
  slug: string
  short_description: string | null
  case_description: string | null
  problem_statement: string | null
  instructions: string[]
  learning_objectives: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_minutes: number
  thumbnail_url: string | null
  scratch_file_url: string | null
  scratch_file_name: string | null
  scratch_file_type: 'starter' | 'partial' | 'blank'
  video_url: string | null
  video_type: 'youtube' | 'external'
  status: 'draft' | 'published' | 'archived'
  sort_order: number
  created_at: string
  updated_at: string
}

export type ExerciseChecklist = {
  id: string
  exercise_id: string
  description: string
  sort_order: number
  created_at: string
}

export type StudentProgress = {
  id: string
  user_id: string
  exercise_id: string
  status: 'in_progress' | 'completed'
  completed_at: string | null
  submitted_scratch_url?: string | null
  submitted_scratch_name?: string | null
  submitted_at?: string | null
  created_at: string
}

export type StudentChecklistProgress = {
  id: string
  user_id: string
  checklist_id: string
  completed_at: string
  created_at: string
}

export type AdminSubmission = {
  user_id: string
  email: string | null
  exercise_id: string
  exercise_title: string
  exercise_slug: string
  category_id: string | null
  status: 'in_progress' | 'completed'
  submitted_scratch_url: string | null
  submitted_scratch_name: string | null
  submitted_at: string | null
  created_at: string
  checklist_done: number
  checklist_total: number
}

export type ExerciseWithCategory = Exercise & {
  categories: Category | null
  /** All categories the exercise belongs to, primary first. */
  categoryList: Category[]
  checklists: ExerciseChecklist[]
}

export type CategoryWithExercises = Category & {
  exercises: Exercise[]
}