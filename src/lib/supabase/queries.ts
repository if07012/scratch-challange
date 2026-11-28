import { createClient } from './server'
import type {
  AdminSubmission,
  Category,
  Exercise,
  ExerciseChecklist,
  ExerciseWithCategory,
} from './types'

// Get all categories
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  return data || []
}

// Get category by slug
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching category:', error)
    return null
  }
  return data
}

// Attach the full category membership set (exercise_categories) to exercises.
// category_ids keeps category_id first so it stays the primary category.
async function withCategoryIds(supabase: Awaited<ReturnType<typeof createClient>>, exercises: Exercise[]): Promise<Exercise[]> {
  if (exercises.length === 0) return exercises
  const { data, error } = await supabase
    .from('exercise_categories')
    .select('exercise_id, category_id')
    .in('exercise_id', exercises.map((exercise) => exercise.id))

  if (error) {
    // Migration not applied yet: fall back to the single primary category.
    console.error('Error fetching exercise categories:', error)
    return exercises.map((exercise) => ({ ...exercise, category_ids: exercise.category_id ? [exercise.category_id] : [] }))
  }

  const byExercise = new Map<string, string[]>()
  for (const row of data || []) {
    const ids = byExercise.get(row.exercise_id) || []
    ids.push(row.category_id)
    byExercise.set(row.exercise_id, ids)
  }

  return exercises.map((exercise) => {
    const ids = byExercise.get(exercise.id) || []
    const ordered = exercise.category_id && ids.includes(exercise.category_id)
      ? [exercise.category_id, ...ids.filter((id) => id !== exercise.category_id)]
      : ids
    return { ...exercise, category_ids: ordered }
  })
}

// Get all published exercises
export async function getPublishedExercises(): Promise<Exercise[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching exercises:', error)
    return []
  }
  return withCategoryIds(supabase, data || [])
}

// Get exercises by category (matches any of the exercise's categories)
export async function getExercisesByCategory(categorySlug: string): Promise<Exercise[]> {
  const supabase = await createClient()
  const category = await getCategoryBySlug(categorySlug)
  if (!category) return []

  const { data, error } = await supabase
    .from('exercise_categories')
    .select('exercise_id, exercises!inner(*)')
    .eq('category_id', category.id)
    .eq('exercises.status', 'published')

  if (error) {
    // Migration not applied yet: fall back to the primary category column.
    const { data: fallback, error: fallbackError } = await supabase
      .from('exercises')
      .select('*')
      .eq('status', 'published')
      .eq('category_id', category.id)
      .order('sort_order', { ascending: true })
    if (fallbackError) {
      console.error('Error fetching exercises by category:', fallbackError)
      return []
    }
    return withCategoryIds(supabase, (fallback || []) as Exercise[])
  }

  const exercises = ((data || []) as unknown as { exercises: Exercise }[])
    .map((row) => row.exercises)
    .sort((a, b) => a.sort_order - b.sort_order)

  return withCategoryIds(supabase, exercises)
}

// Get exercise by slug with category and checklists
export async function getExerciseBySlug(slug: string): Promise<ExerciseWithCategory | null> {
  const supabase = await createClient()

  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (exerciseError || !exercise) {
    console.error('Error fetching exercise:', exerciseError)
    return null
  }

  return hydrateExercise(supabase, exercise as Exercise)
}

// Categories are resolved from exercise_categories instead of an embedded join:
// the junction table gives PostgREST a second exercises<->categories path, which
// makes `categories (*)` ambiguous.
async function hydrateExercise(
  supabase: Awaited<ReturnType<typeof createClient>>,
  exercise: Exercise,
): Promise<ExerciseWithCategory> {
  const [{ data: checklists, error: checklistError }, [withIds]] = await Promise.all([
    supabase
      .from('exercise_checklists')
      .select('*')
      .eq('exercise_id', exercise.id)
      .order('sort_order', { ascending: true }),
    withCategoryIds(supabase, [exercise]),
  ])

  if (checklistError) {
    console.error('Error fetching checklists:', checklistError)
  }

  const { data: categoryRows } = withIds.category_ids.length
    ? await supabase.from('categories').select('*').in('id', withIds.category_ids)
    : { data: [] as Category[] }

  const byId = new Map((categoryRows || []).map((category) => [category.id, category]))
  const categoryList = withIds.category_ids
    .map((categoryId) => byId.get(categoryId))
    .filter((category): category is Category => Boolean(category))

  return {
    ...exercise,
    categories: categoryList[0] ?? null,
    category_ids: withIds.category_ids,
    categoryList,
    checklists: checklists || [],
  } as ExerciseWithCategory
}

// Get all exercises for admin (including drafts)
export async function getAllExercisesAdmin(): Promise<Exercise[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all exercises:', error)
    return []
  }
  return withCategoryIds(supabase, data || [])
}

// Get exercise by ID for admin
export async function getExerciseById(id: string): Promise<ExerciseWithCategory | null> {
  const supabase = await createClient()

  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()

  if (exerciseError || !exercise) {
    console.error('Error fetching exercise:', exerciseError)
    return null
  }

  return hydrateExercise(supabase, exercise as Exercise)
}

// Create new exercise
export async function createExercise(exercise: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>): Promise<Exercise | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single()

  if (error) {
    console.error('Error creating exercise:', error)
    return null
  }
  return data
}

// Update exercise
export async function updateExercise(id: string, updates: Partial<Exercise>): Promise<Exercise | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exercises')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating exercise:', error)
    return null
  }
  return data
}

// Student submissions/progress for admins (view filters to admin JWTs).
export async function getAdminSubmissions(): Promise<AdminSubmission[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('admin_student_submissions')
    .select('*')
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching submissions:', error)
    return []
  }
  return data || []
}

// Delete exercise
export async function deleteExercise(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting exercise:', error)
    return false
  }
  return true
}

// Create checklist item
export async function createChecklistItem(checklist: Omit<ExerciseChecklist, 'id' | 'created_at'>): Promise<ExerciseChecklist | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exercise_checklists')
    .insert(checklist)
    .select()
    .single()

  if (error) {
    console.error('Error creating checklist item:', error)
    return null
  }
  return data
}

// Update checklist item
export async function updateChecklistItem(id: string, description: string): Promise<ExerciseChecklist | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exercise_checklists')
    .update({ description })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating checklist item:', error)
    return null
  }
  return data
}

// Delete checklist item
export async function deleteChecklistItem(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('exercise_checklists')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting checklist item:', error)
    return false
  }
  return true
}