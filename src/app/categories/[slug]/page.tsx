import { Suspense } from 'react'
import { getCategories, getCategoryBySlug, getExercisesByCategory } from '@/lib/supabase/queries'
import { CategoryPageClient } from './CategoryPageClient'
import type { Category } from '@/lib/supabase/types'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params

  const [categories, category, exercises] = await Promise.all([
    getCategories(),
    getCategoryBySlug(resolvedParams.slug),
    getExercisesByCategory(resolvedParams.slug),
  ])

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Kategori tidak ditemukan</h1>
          <p className="text-gray-600">Kategori yang Anda cari tidak ada.</p>
          <a href="/exercises" className="mt-4 inline-block text-blue-600 hover:underline">Kembali ke daftar latihan</a>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<CategoryPageSkeleton categoryName={category.name} />}>
      <CategoryPageClient category={category} exercises={exercises} categories={categories} />
    </Suspense>
  )
}

function CategoryPageSkeleton({ categoryName }: { categoryName: string }) {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/4" />
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}