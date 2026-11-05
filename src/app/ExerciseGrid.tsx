import { getCategories, getPublishedExercises } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { ExerciseCard } from '@/components/ExerciseCard'

const difficulties = [
  { id: 'beginner', name: 'Pemula', color: 'bg-green-100 text-green-700' },
  { id: 'intermediate', name: 'Menengah', color: 'bg-blue-100 text-blue-700' },
  { id: 'advanced', name: 'Lanjutan', color: 'bg-purple-100 text-purple-700' },
]

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
  const returnTo = new URLSearchParams()
  if (selectedCategory !== 'all') returnTo.set('category', selectedCategory)
  if (selectedDifficulty !== 'all') returnTo.set('difficulty', selectedDifficulty)
  const returnQuery = returnTo.toString()
  const returnPath = returnQuery ? `/?${returnQuery}` : '/'

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
          difficulties={difficulties}
          completed={completedExerciseIds.includes(exercise.id)}
          returnTo={returnPath}
        />
      ))}
    </div>
  )
}