import { createClient } from './server'
import type {
  Category,
  Exercise,
  ExerciseChecklist,
  ExerciseWithCategory,
  CategoryWithExercises,
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
  return data || []
}

// Get exercises by category
export async function getExercisesByCategory(categorySlug: string): Promise<Exercise[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select('*, categories!inner(slug)')
    .eq('status', 'published')
    .eq('categories.slug', categorySlug)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching exercises by category:', error)
    return []
  }
  return data || []
}

// Get exercise by slug with category and checklists
export async function getExerciseBySlug(slug: string): Promise<ExerciseWithCategory | null> {
  const supabase = await createClient()

  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .select(`
      *,
      categories (*)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (exerciseError || !exercise) {
    console.error('Error fetching exercise:', exerciseError)
    return null
  }

  const { data: checklists, error: checklistError } = await supabase
    .from('exercise_checklists')
    .select('*')
    .eq('exercise_id', exercise.id)
    .order('sort_order', { ascending: true })

  if (checklistError) {
    console.error('Error fetching checklists:', checklistError)
  }

  return {
    ...exercise,
    categories: exercise.categories,
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
  return data || []
}

// Get exercise by ID for admin
export async function getExerciseById(id: string): Promise<ExerciseWithCategory | null> {
  const supabase = await createClient()

  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .select(`
      *,
      categories (*)
    `)
    .eq('id', id)
    .single()

  if (exerciseError || !exercise) {
    console.error('Error fetching exercise:', exerciseError)
    return null
  }

  const { data: checklists, error: checklistError } = await supabase
    .from('exercise_checklists')
    .select('*')
    .eq('exercise_id', exercise.id)
    .order('sort_order', { ascending: true })

  if (checklistError) {
    console.error('Error fetching checklists:', checklistError)
  }

  return {
    ...exercise,
    categories: exercise.categories,
    checklists: checklists || [],
  } as ExerciseWithCategory
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