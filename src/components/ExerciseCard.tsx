'use client'

import { cn, getGoogleDriveMediaUrl } from '@/lib/utils'
import Image from 'next/image'
import { BookOpen, CheckCircle2, Clock, Zap, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import type { Exercise, Category } from '@/lib/supabase/types'
import { difficultyConfig } from '@/lib/design-system'

interface ExerciseCardProps {
  exercise: Exercise
  categories: Category[]
  completed?: boolean
}

export function ExerciseCard({ exercise, categories, completed = false }: ExerciseCardProps) {
  const category = categories.find((c) => c.id === exercise.category_id)
  const diffConfig = difficultyConfig[exercise.difficulty as keyof typeof difficultyConfig] || difficultyConfig.beginner

  return (
    <article className={cn(
      'group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-neutral-200',
      'transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary-200',
      'animate-fade-in'
    )}>
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        {exercise.thumbnail_url ? (
          <Image
            src={getGoogleDriveMediaUrl(exercise.thumbnail_url, 'thumbnail') || exercise.thumbnail_url}
            alt={exercise.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
            <BookOpen className="w-16 h-16 text-primary-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {category && (
            <span className="badge badge-primary px-3 py-1 text-xs">
              {category.name}
            </span>
          )}
          <span className={cn(
            'badge px-3 py-1 text-xs font-medium border',
            diffConfig.badge
          )}>
            <span className="mr-1" aria-hidden="true" >{diffConfig.icon}</span>
            {diffConfig.label}
          </span>
        </div>

        {completed && (
          <div className="absolute inset-0 bg-primary-600/95 flex items-center justify-center animate-fade-in">
            <div className="text-center p-6 animate-scale-in">
              <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-3" />
              <p className="text-xl font-bold text-white">Tantangan Selesai</p>
              <p className="text-primary-100 mt-1">Kerja bagus! Lanjutkan belajar.</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-5 space-y-4">
        <h3 className="text-lg font-bold text-neutral-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {exercise.title}
        </h3>
        
        <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed">
          {exercise.short_description || 'Tidak ada deskripsi singkat.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-200">
          <div className="flex items-center gap-1.5 text-sm text-neutral-600">
            <Clock className="w-4 h-4 shrink-0 text-neutral-400" />
            <span>{exercise.estimated_minutes} menit</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm text-neutral-600">
            <Zap className="w-4 h-4 shrink-0 text-neutral-400" />
            <span className="font-medium text-neutral-900" >{diffConfig.label}</span>
          </div>
        </div>

        <Link
          href={`/exercises/${exercise.slug}`}
          className="btn-primary w-full justify-center py-3 group"
        >
          <PlayCircle className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          <span>{completed ? 'Ulangi Tantangan' : 'Mulai Tantangan'}</span>
        </Link>
      </div>
    </article>
  )
}