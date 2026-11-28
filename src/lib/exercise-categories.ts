import type { SupabaseClient } from '@supabase/supabase-js'

// Replace an exercise's category membership set (exercise_categories).
// Returns an error message, or null on success.
export async function syncCategories(
  supabase: SupabaseClient,
  exerciseId: string,
  categoryIds: string[],
): Promise<string | null> {
  const { error: deleteError } = await supabase
    .from('exercise_categories')
    .delete()
    .eq('exercise_id', exerciseId)
  if (deleteError) return deleteError.message
  if (categoryIds.length === 0) return null

  const { error } = await supabase
    .from('exercise_categories')
    .insert(categoryIds.map((category_id) => ({ exercise_id: exerciseId, category_id })))
  return error?.message ?? null
}
