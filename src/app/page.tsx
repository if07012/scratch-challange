import { Suspense } from 'react'
import { getCategories } from '@/lib/supabase/queries'
import { ClientFilters } from './ClientFilters'
import { ExerciseGrid } from './ExerciseGrid'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; difficulty?: string }>
}) {
  const categories = await getCategories()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Scratch Challenge</h1>
            <div className="flex items-center gap-4">
              <a href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Admin</a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Kumpulan Latihan Scratch</h2>
          <p className="text-gray-600">Pilih latihan untuk mulai belajar coding dengan Scratch</p>
        </div>

        <ClientFilters categories={categories} />

        <Suspense fallback={<ExerciseGridSkeleton />}>
          <ExerciseGrid searchParams={searchParams} />
        </Suspense>
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

function ExerciseGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => <ExerciseCardSkeleton key={i} />)}
    </div>
  )
}

function ExerciseCardSkeleton() {
  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-1/4" />
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </article>
  )
}