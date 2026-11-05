import { Suspense } from 'react'
import { getExerciseBySlug } from '@/lib/supabase/queries'
import { ExerciseDetailClient } from './ExerciseDetailClient'
import type { ExerciseWithCategory } from '@/lib/supabase/types'

interface ExerciseDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function ExerciseDetail({ params }: ExerciseDetailPageProps) {
  const resolvedParams = await params
  const exercise = await getExerciseBySlug(resolvedParams.slug)

  if (!exercise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Latihan tidak ditemukan</h1>
          <p className="text-gray-600">Latihan yang Anda cari tidak ada atau belum dipublikasikan.</p>
          <a href="/exercises" className="mt-4 inline-block text-blue-600 hover:underline">Kembali ke daftar latihan</a>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<ExerciseDetailSkeleton />}>
      <ExerciseDetailClient exercise={exercise} />
    </Suspense>
  )
}

function ExerciseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-48 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </main>
    </div>
  )
}