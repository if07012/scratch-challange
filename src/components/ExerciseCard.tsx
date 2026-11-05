'use client'

import { cn, getGoogleDriveMediaUrl } from '@/lib/utils'
import { ChevronLeft, BookOpen, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import type { Exercise, Category } from '@/lib/supabase/types'

interface DifficultyConfig {
  id: string
  name: string
  color: string
}

interface ExerciseCardProps {
  exercise: Exercise
  categories: Category[]
  difficulties: DifficultyConfig[]
  completed?: boolean
  returnTo?: string
}

export function ExerciseCard({ exercise, categories, difficulties, completed = false, returnTo = '/' }: ExerciseCardProps) {
  const category = categories.find((c) => c.id === exercise.category_id)
  const difficulty = difficulties.find((d) => d.id === exercise.difficulty)

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {exercise.thumbnail_url ? (
          <img
            src={getGoogleDriveMediaUrl(exercise.thumbnail_url, 'thumbnail') || exercise.thumbnail_url}
            alt={exercise.title}
            onError={(event) => { event.currentTarget.style.display = 'none' }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={cn('px-2 py-1 text-xs font-medium rounded-full', difficulty?.color)}>
            {difficulty?.name}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {category && (
            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', category.color_class)}>
              {category.name}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{exercise.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{exercise.short_description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {exercise.estimated_minutes} menit
            </span>
            {completed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
              </span>
            )}
          </span>
          <Link
            href={`/exercises/${exercise.slug}?from=${encodeURIComponent(returnTo)}`}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {completed ? 'Ulangi' : 'Mulai'} <ChevronLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>
    </article>
  )
}