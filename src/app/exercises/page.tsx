import { Suspense } from "react"
import Link from "next/link"
import { BookOpen, ArrowLeft } from "lucide-react"
import { getCategories } from "@/lib/supabase/queries"
import { ClientFilters } from "@/app/ClientFilters"
import { ExerciseGrid } from "@/app/ExerciseGrid"
import { createClient } from "@/lib/supabase/server"
import { LogoutButton } from "@/components/LogoutButton"

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; difficulty?: string }>
}) {
  const [categories, supabase] = await Promise.all([getCategories(), createClient()])
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors shrink-0" aria-label="Kembali">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-neutral-900 leading-tight">Semua Tantangan</h1>
              <p className="text-xs text-neutral-500">Scratch Challenge</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.app_metadata?.role === "admin" && (
              <Link href="/admin" className="hidden sm:inline text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">Admin</Link>
            )}
            {user && <LogoutButton className="text-sm font-medium text-neutral-600 hover:text-neutral-900" />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">Jelajahi Tantangan</h2>
          <p className="text-neutral-600">Temukan latihan yang cocok untukmu</p>
        </div>

        <ClientFilters categories={categories} />

        <Suspense fallback={<GridSkeleton />}>
          <ExerciseGrid searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <article key={i} className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden animate-pulse">
          <div className="aspect-video bg-neutral-200" />
          <div className="p-5 space-y-3">
            <div className="h-6 bg-neutral-200 rounded w-3/4" />
            <div className="h-4 bg-neutral-200 rounded w-full" />
            <div className="h-10 bg-neutral-200 rounded w-full mt-4" />
          </div>
        </article>
      ))}
    </div>
  )
}
