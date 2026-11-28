'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowLeft, Filter, X, ChevronDown, Sparkles, Trophy, Target } from 'lucide-react'
import { ExerciseCard } from '@/components/ExerciseCard'
import { Button } from '@/components/ui/Button'
import type { Exercise, Category } from '@/lib/supabase/types'

interface CategoryPageClientProps {
  category: Category
  exercises: Exercise[]
  categories: Category[]
}

const difficulties = [
  { value: 'all', label: 'Semua', icon: Sparkles },
  { value: 'beginner', label: 'Pemula', icon: Target },
  { value: 'intermediate', label: 'Menengah', icon: Trophy },
  { value: 'advanced', label: 'Lanjutan', icon: Sparkles },
] as const

type DifficultyFilter = typeof difficulties[number]['value']

function CategoryHeader({ category, exercises }: { category: Category; exercises: Exercise[] }) {
  return (
    <header className={cn(
      'relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800',
      'text-white shadow-xl',
      'animate-slide-up'
    )}>
      <div className='absolute inset-0 bg-[var(--pattern-grid)] opacity-10' />
      <div className='absolute inset-0 bg-gradient-to-t from-primary-900/50 via-transparent to-transparent' />

      <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16'>
        <Link
          href='/exercises'
          className='inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 group animate-fade-in'
        >
          <ArrowLeft className='w-5 h-5 group-hover:-translate-x-1 transition-transform' />
          <span className='font-medium'>Kembali ke Latihan</span>
        </Link>

        <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4'>
          <div className='animate-fade-in animate-delay-100'>
            <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm mb-4'>
              <span className='text-lg'>{category.icon_name || '📚'}</span>
              <span className='text-sm font-medium'>{category.name}</span>
            </div>
            <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight'>
              {category.name}
            </h1>
            {category.description && (
              <p className='mt-3 text-lg text-white/90 max-w-2xl leading-relaxed'>
                {category.description}
              </p>
            )}
          </div>

          <div className='flex items-center gap-4 animate-fade-in animate-delay-200'>
            <div className='hidden sm:flex items-center gap-4 text-white/80'>
              <div className='flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm'>
                <Trophy className='w-5 h-5' />
                <span className='font-medium'>{exercises.length} Tantangan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function DifficultyFilterChips({
  selected,
  onChange,
  exercises
}: {
  selected: DifficultyFilter
  onChange: (value: DifficultyFilter) => void
  exercises: Exercise[]
}) {
  const counts = useMemo(() => {
    const map: Record<DifficultyFilter, number> = { all: exercises.length, beginner: 0, intermediate: 0, advanced: 0 }
    exercises.forEach(ex => {
      if (ex.difficulty in map) map[ex.difficulty as DifficultyFilter]++
    })
    return map
  }, [exercises])

  return (
    <div className='flex flex-wrap items-center gap-2 animate-fade-in animate-delay-300' role='group' aria-label='Filter tingkat kesulitan'>
      {difficulties.map((diff) => {
        const isSelected = selected === diff.value
        const count = counts[diff.value]
                return (
          <button
            key={diff.value}
            onClick={() => onChange(diff.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
              isSelected
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                : 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/20',
              count === 0 && !isSelected && 'opacity-50 cursor-not-allowed'
            )}
            disabled={count === 0 && !isSelected}
            aria-pressed={isSelected}
            aria-label={`${diff.label} (${count} latihan)`}
          >
            <diff.icon className='w-4 h-4' aria-hidden='true' />
            <span>{diff.label}</span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-semibold',
              isSelected ? 'bg-white/30' : 'bg-white/10'
            )}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function CategoryFilters({
  exercises,
  categories,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  searchQuery,
  onSearchChange
}: {
  exercises: Exercise[]
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (value: string) => void
  selectedDifficulty: DifficultyFilter
  onDifficultyChange: (value: DifficultyFilter) => void
  searchQuery: string
  onSearchChange: (value: string) => void
}) {
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: exercises.length }
    categories.forEach(c => map[c.slug] = 0)
    exercises.forEach(ex => {
      const ids = ex.category_ids?.length ? ex.category_ids : ex.category_id ? [ex.category_id] : []
      categories.filter(c => ids.includes(c.id)).forEach(cat => {
        map[cat.slug] = (map[cat.slug] || 0) + 1
      })
    })
    return map
  }, [exercises, categories])

  return (
    <div className='sticky top-20 z-40 animate-slide-down'>
      <div className='bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-200 shadow-sm p-4 sm:p-6'>
        <div className='space-y-6'>
          <div>
            <label htmlFor='search' className='sr-only'>Cari latihan</label>
            <div className='relative'>
              <Filter className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400' aria-hidden='true' />
              <input
                id='search'
                type='search'
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder='Cari latihan...'
                className='w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all'
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors'
                  aria-label='Hapus pencarian'
                >
                  <X className='w-5 h-5' />
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor='category-filter' className='block text-sm font-medium text-neutral-700 mb-2'>Kategori</label>
            <div className='relative'>
              <select
                id='category-filter'
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className='w-full appearance-none pl-4 pr-12 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer'
              >
                <option value='all'>Semua Kategori ({categoryCounts.all})</option>
                {categories.map(cat => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name} ({categoryCounts[cat.slug] || 0})
                  </option>
                ))}
              </select>
              <ChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none' aria-hidden='true' />
            </div>
          </div>

          <DifficultyFilterChips
            selected={selectedDifficulty}
            onChange={onDifficultyChange}
            exercises={exercises}
          />
        </div>
      </div>
    </div>
  )
}

function ExerciseGrid({
  exercises,
  categories,
  completedExercises = []
}: {
  exercises: Exercise[]
  categories: Category[]
  completedExercises?: string[]
}) {
  if (exercises.length === 0) {
    return (
      <div className='text-center py-16 animate-fade-in'>
        <div className='inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-neutral-100 mb-6'>
          <Trophy className='w-10 h-10 text-neutral-400' />
        </div>
        <h3 className='text-xl font-semibold text-neutral-900 mb-2'>Belum ada latihan</h3>
        <p className='text-neutral-600 max-w-md mx-auto'>
          Coba ubah filter atau pilih kategori lain untuk menemukan tantangan menarik.
        </p>
      </div>
    )
  }

  return (
    <div
      className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
      role='list'
      aria-label='Daftar latihan'
    >
      {exercises.map((exercise, index) => (
        <div key={exercise.id} style={{ animationDelay: `${index * 50}ms` }} className='animate-fade-in animate-slide-up'>
          <ExerciseCard
            exercise={exercise}
            categories={categories}
            completed={completedExercises.includes(exercise.id)}
          />
        </div>
      ))}
    </div>
  )
}

export function CategoryPageClient({ category, exercises, categories }: CategoryPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('all')
  const [completedExercises] = useState<string[]>([])

  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.short_description?.toLowerCase().includes(searchQuery.toLowerCase())

      const categoryId = categories.find(c => c.slug === selectedCategory)?.id
      const matchesCategory = selectedCategory === 'all' || (exercise.category_ids?.length
        ? exercise.category_ids.includes(categoryId || '')
        : exercise.category_id === categoryId)

      const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty

      return matchesSearch && matchesCategory && matchesDifficulty
    })
  }, [exercises, categories, searchQuery, selectedCategory, selectedDifficulty])

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value)
    setSearchQuery('')
  }, [])

  const handleDifficultyChange = useCallback((value: DifficultyFilter) => {
    setSelectedDifficulty(value)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  return (
    <div className='min-h-screen bg-neutral-50'>
      <CategoryHeader category={category} exercises={exercises} />

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='flex flex-col lg:flex-row gap-8'>
          <aside className='lg:w-64 flex-shrink-0'>
            <CategoryFilters
              exercises={exercises}
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              selectedDifficulty={selectedDifficulty}
              onDifficultyChange={handleDifficultyChange}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
            />
          </aside>

          <div className='flex-1'>
            <div className='flex items-center justify-between mb-6 animate-fade-in'>
              <div>
                <p className='text-sm text-neutral-600'>
                  Menampilkan <span className='font-semibold text-neutral-900'>{filteredExercises.length}</span> dari{' '}
                  <span className='font-semibold text-neutral-900'>{exercises.length}</span> latihan
                </p>
              </div>
              {(searchQuery || selectedCategory !== 'all' || selectedDifficulty !== 'all') && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                    setSelectedDifficulty('all')
                  }}
                  className='animate-fade-in'
                >
                  <X className='w-4 h-4 mr-1' />
                  Hapus Filter
                </Button>
              )}
            </div>

            <ExerciseGrid
              exercises={filteredExercises}
              categories={categories}
              completedExercises={completedExercises}
            />
          </div>
        </div>
      </main>
    </div>
  )
}