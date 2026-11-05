import { getCategories, getPublishedExercises } from '@/lib/supabase/queries'
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

  const [categories, exercises] = await Promise.all([
    getCategories(),
    getPublishedExercises(),
  ])

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
        />
      ))}
    </div>
  )
}