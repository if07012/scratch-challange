import { getCategories, getPublishedExercises } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { ExerciseCard } from '@/components/ExerciseCard'

interface ExerciseGridProps {
  searchParams: Promise<{ category?: string; difficulty?: string }>
}

export async function ExerciseGrid({ searchParams }: ExerciseGridProps) {
  const resolvedSearchParams = await searchParams
  const selectedCategory = resolvedSearchParams.category || 'all'
  const selectedDifficulty = resolvedSearchParams.difficulty || 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [categories, exercises, progressResult] = await Promise.all([
    getCategories(),
    getPublishedExercises(),
    user
      ? supabase.from('student_progress').select('exercise_id').eq('user_id', user.id).eq('status', 'completed')
      : Promise.resolve({ data: [] }),
  ])

  const completedExerciseIds = (progressResult.data || []).map((item) => item.exercise_id)

  const filteredExercises = exercises.filter((exercise) => {
    const categoryMatch = selectedCategory === 'all' || exercise.category_id === selectedCategory
    const difficultyMatch = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty
    return categoryMatch && difficultyMatch
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredExercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          categories={categories}
          completed={completedExerciseIds.includes(exercise.id)}
        />
      ))}
    </div>
  )
}
