'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Category } from '@/lib/supabase/types'

const difficulties = [
  { id: 'beginner', name: 'Pemula', color: 'bg-green-100 text-green-700' },
  { id: 'intermediate', name: 'Menengah', color: 'bg-blue-100 text-blue-700' },
  { id: 'advanced', name: 'Lanjutan', color: 'bg-purple-100 text-purple-700' },
]

interface ClientFiltersProps {
  categories: Category[]
}

export function ClientFilters({ categories }: ClientFiltersProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const selectedCategory = searchParams.get('category') || 'all'
  const selectedDifficulty = searchParams.get('difficulty') || 'all'

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    router.push(`/?${params.toString()}`)
  }

  const handleDifficultyChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('difficulty')
    } else {
      params.set('difficulty', value)
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <div className="flex-1">
        <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
          Kategori
        </label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className={cn(
            'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'bg-white text-gray-900'
          )}
        >
          <option value="all">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label htmlFor="difficulty-filter" className="block text-sm font-medium text-gray-700 mb-1">
          Tingkat Kesulitan
        </label>
        <select
          id="difficulty-filter"
          value={selectedDifficulty}
          onChange={(e) => handleDifficultyChange(e.target.value)}
          className={cn(
            'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
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
    </div>
  )
}