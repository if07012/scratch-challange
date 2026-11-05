'use client'

import { cn } from '@/lib/utils'
import { BookOpen, ChevronLeft, Filter, Trophy } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { ExerciseCard } from '@/components/ExerciseCard'
import type { Category, Exercise } from '@/lib/supabase/types'

const difficulties = [
  { id: 'beginner', name: 'Pemula', color: 'bg-green-100 text-green-700' },
  { id: 'intermediate', name: 'Menengah', color: 'bg-blue-100 text-blue-700' },
  { id: 'advanced', name: 'Lanjutan', color: 'bg-purple-100 text-purple-700' },
]

interface CategoryPageClientProps {
  category: Category
  exercises: Exercise[]
  categories: Category[]
}

export function CategoryPageClient({ category, exercises, categories }: CategoryPageClientProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  const filteredExercises = exercises.filter((exercise) => {
    const difficultyMatch = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty
    return difficultyMatch
  })

  const IconComponent = category.icon_name
    ? (({ className }: { className?: string }) => <BookOpen className={className} />)
    : (({ className }: { className?: string }) => <BookOpen className={className} />)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/exercises" className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                Semua Latihan
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Admin</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn('p-3 rounded-xl', category.color_class)}>
              <IconComponent className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-gray-600">{category.description}</p>
            </div>
          </div>
          <p className="text-gray-600 max-w-2xl">
            {exercises.length} latihan tersedia di kategori ini
          </p>
        </div>

        <div className="mb-8">
          <label htmlFor="difficulty-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter Tingkat Kesulitan
          </label>
          <select
            id="difficulty-filter"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className={cn(
              'w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'bg-white text-gray-900'
            )}
          >
            <option value="all">Semua Tingkat</option>
            {difficulties.map((diff) => (
              <option key={diff.id} value={diff.id}>
                {diff.name}
              </option>
            ))}
          </select>
        </div>

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

        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada latihan ditemukan</h3>
            <p className="text-gray-500">Coba ubah filter tingkat kesulitan</p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            Scratch Challenge - Platform pembelajaran coding untuk anak-anak
          </p>
        </div>
      </footer>
    </div>
  )
}

// Import missing icons
import { Zap, GitBranch, RefreshCw, Database, Braces } from 'lucide-react'