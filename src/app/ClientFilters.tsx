'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { X, Filter } from 'lucide-react'
import { Category } from '@/lib/supabase/types'
import { difficultyConfig } from '@/lib/design-system'

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

  const hasActiveFilters = selectedCategory !== 'all' || selectedDifficulty !== 'all'

  return (
    <div className="flex flex-col gap-4 mb-8 animate-slide-in">
      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-primary-600" />
        <span className="text-sm font-semibold text-neutral-900">Filter Latihan</span>
        {hasActiveFilters && (
          <button
            onClick={() => router.push('/')}
            className="ml-auto text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            Hapus semua
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1.5 text-xs font-medium text-neutral-500">Kategori:</span>
        <button
          onClick={() => handleCategoryChange('all')}
          className={cn(
            'filter-chip px-3 py-1.5 text-sm font-medium rounded-full transition-all',
            selectedCategory === 'all'
              ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
              : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-primary-300'
          )}
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={cn(
              'filter-chip px-3 py-1.5 text-sm font-medium rounded-full transition-all',
              selectedCategory === cat.id
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-primary-300'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1.5 text-xs font-medium text-neutral-500">Tingkat:</span>
        <button
          onClick={() => handleDifficultyChange('all')}
          className={cn(
            'filter-chip px-3 py-1.5 text-sm font-medium rounded-full transition-all',
            selectedDifficulty === 'all'
              ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
              : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-primary-300'
          )}
        >
          Semua
        </button>
        {Object.entries(difficultyConfig).map(([key, config]) => (
          <button
            key={key}
            onClick={() => handleDifficultyChange(key)}
            className={cn(
              'filter-chip px-3 py-1.5 text-sm font-medium rounded-full transition-all flex items-center gap-1.5',
              selectedDifficulty === key
                ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-primary-300'
            )}
          >
            <span aria-hidden="true" >{config.icon}</span>
            {config.label}
          </button>
        ))}
      </div>
    </div>
  )
}