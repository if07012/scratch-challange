import { Suspense } from "react"
import { getCategories } from "@/lib/supabase/queries"
import { ClientFilters } from "./ClientFilters"
import { ExerciseGrid } from "./ExerciseGrid"
import { createClient } from "@/lib/supabase/server"
import { getPublishedExercises } from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { BookOpen, Award, Target, ArrowRight, PlayCircle, TrendingUp, Sparkles, Zap, CheckCircle2, Clock } from "lucide-react"
import { difficultyConfig } from "@/lib/design-system"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; difficulty?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const selectedCategory = resolvedSearchParams.category || "all"
  const selectedDifficulty = resolvedSearchParams.difficulty || "all"

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [exercises, categoriesWithCounts, progressResult] = await Promise.all([
    getPublishedExercises(),
    getCategories(),
    user
      ? supabase.from("student_progress").select("exercise_id").eq("user_id", user.id).eq("status", "completed")
      : Promise.resolve({ data: [] }),
  ])

  const completedExerciseIds = (progressResult.data || []).map((item) => item.exercise_id)
  const completedCount = completedExerciseIds.length
  const totalExercises = exercises.length
  const progressPercentage = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0

  const inProgressExercises = exercises.filter(e => !completedExerciseIds.includes(e.id))
  const recommendedExercises = inProgressExercises.slice(0, 3)

  const returnTo = new URLSearchParams()
  if (selectedCategory !== "all") returnTo.set("category", selectedCategory)
  if (selectedDifficulty !== "all") returnTo.set("difficulty", selectedDifficulty)
  const returnQuery = returnTo.toString()
  const returnPath = returnQuery ? "?" + returnQuery : "/"

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-neutral-900">Scratch Challenge</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-12 animate-fade-in">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 p-8 sm:p-12">
            <div className="absolute inset-0 bg-[var(--pattern-grid)] opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium">
                  <Sparkles className="w-4 h-4 inline mr-1" /> Platform Belajar Coding
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                Belajar Coding Seru dengan <span className="text-accent-300">Scratch</span>
              </h2>
              <p className="text-primary-100 text-lg sm:text-xl max-w-2xl mb-8">
                Temukan tantangan menarik, pelajari logika pemrograman, dan bangun project kreatifmu sendiri!
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={"/exercises" + returnPath}
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 rounded-xl font-semibold text-base hover:bg-primary-50 transition-all shadow-lg shadow-primary-900/10"
                >
                  <PlayCircle className="w-5 h-5" />
                  Mulai Jelajahi
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                {user && (
                  <Link
                    href="/exercises?difficulty=beginner"
                    className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white rounded-xl font-semibold text-base hover:bg-white/10 transition-all"
                  >
                    <Target className="w-5 h-5" />
                    Latihan Pemula
                  </Link>
                )}
              </div>
            </div>

            {/* Floating stats */}
            <div className="absolute bottom-6 right-6 hidden lg:block animate-slide-up" style={{animationDelay: "200ms"}}>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{totalExercises}+</p>
                  <p className="text-primary-100 text-sm">Tantangan</p>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{completedCount}</p>
                  <p className="text-primary-100 text-sm">Selesai</p>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{progressPercentage}%</p>
                  <p className="text-primary-100 text-sm">Progress</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* User Progress Section */}
        {user && (
          <section className="mb-12 animate-slide-up" style={{animationDelay: "100ms"}}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-neutral-900">Progress Belajarmu</h3>
                <p className="text-neutral-600">Teruskan perjalanan coding-mu!</p>
              </div>
              <Link
                href={"/exercises" + returnPath}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
              >
                Lihat semua <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Overall Progress Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">Progress Keseluruhan</p>
                        <p className="text-sm text-neutral-500">{completedCount} dari {totalExercises} tantangan</p>
                      </div>
                    </div>
                    <div className="w-full">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-neutral-700">Kemajuan</span>
                        <span className="font-bold text-primary-600">{progressPercentage}%</span>
                      </div>
                      <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-1000 ease-out"
                          style={{width: progressPercentage + "%"}}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-4xl font-bold text-primary-600">{progressPercentage}%</p>
                    <p className="text-xs text-neutral-500">Terselesaikan</p>
                  </div>
                </div>
              </div>

              {/* Completed Challenges */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{completedCount}</p>
                    <p className="text-sm text-neutral-500">Tantangan Selesai</p>
                  </div>
                </div>
              </div>

              {/* Current Level */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center">
                    <Award className="w-6 h-6 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">
                      {progressPercentage >= 80 ? "Mahir" : progressPercentage >= 50 ? "Menengah" : progressPercentage > 0 ? "Pemula" : "Baru Mulai"}
                    </p>
                    <p className="text-sm text-neutral-500">Level Saat Ini</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Continue Learning Section */}
        {user && recommendedExercises.length > 0 && (
          <section className="mb-12 animate-slide-up" style={{animationDelay: "200ms"}}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-neutral-900">Lanjutkan Belajar</h3>
                <p className="text-neutral-600">Tantangan yang belum selesai</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedExercises.map((exercise) => {
                const category = categoriesWithCounts.find((c) => c.id === exercise.category_id)
                const diffConfig = difficultyConfig[exercise.difficulty as keyof typeof difficultyConfig] || difficultyConfig.beginner
                return (
                  <Link
                    key={exercise.id}
                    href={"/exercises/" + exercise.slug + returnPath}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-neutral-200",
                      "transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary-200",
                      "p-5 flex flex-col h-full"
                    )}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-7 h-7 text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-neutral-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                          {exercise.title}
                        </h4>
                        <p className="text-sm text-neutral-600 line-clamp-2 mt-1">
                          {exercise.short_description || "Tidak ada deskripsi."}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {category && (
                        <span className="badge badge-primary px-2.5 py-1 text-xs">
                          {category.name}
                        </span>
                      )}
                      <span className={cn(
                        "badge px-2.5 py-1 text-xs font-medium border flex items-center gap-1",
                        diffConfig.badge
                      )}>
                        <span aria-hidden="true">{diffConfig.icon}</span>
                        {diffConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                      <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                        <Clock className="w-4 h-4 shrink-0 text-neutral-400" />
                        <span>{exercise.estimated_minutes} menit</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-full text-sm font-medium group-hover:bg-primary-700 transition-colors">
                        Lanjutkan
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Explore All Exercises Section */}
        <section className="mb-12 animate-slide-up" style={{animationDelay: "300ms"}}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900">Semua Tantangan</h3>
              <p className="text-neutral-600">Temukan latihan yang cocok untukmu</p>
            </div>
          </div>

          <ClientFilters categories={categoriesWithCounts} />

          <Suspense fallback={<ExerciseGridSkeleton />}>
            <ExerciseGrid searchParams={searchParams} />
          </Suspense>
        </section>

        {/* Features Section */}
        <section className="mb-12 animate-slide-up" style={{animationDelay: "400ms"}}>
          <h3 className="text-2xl font-bold text-neutral-900 text-center mb-10">Kenapa Belajar di Scratch Challenge?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Zap}
              title="Interaktif & Menyenangkan"
              desc="Pelajari coding melalui tantangan visual yang membuat logika pemrograman mudah dipahami."
              color="primary"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Progress Terukur"
              desc="Pantau kemajuan belajarmu dengan checklist, level, dan pencapaian yang memotivasi."
              color="secondary"
            />
            <FeatureCard
              icon={Award}
              title="Project Nyata"
              desc="Bangun project Scratch asli (.sb3) yang bisa dibagikan dan dikembangkan lebih lanjut."
              color="accent"
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="animate-slide-up" style={{animationDelay: "500ms"}}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-secondary-600 p-8 sm:p-12 text-center">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Siap memulai petualangan coding?
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Mulai Tantangan Pertama Kamu Hari Ini
              </h3>
              <p className="text-primary-100 text-lg max-w-2xl mx-auto mb-8">
                Ribuan anak sudah belajar logika pemrograman dengan seru. Bergabung sekarang dan buat project Scratch pertamamu!
              </p>
              <Link
                href={"/exercises" + returnPath}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-all shadow-xl"
              >
                <PlayCircle className="w-6 h-6" />
                Jelajahi Semua Tantangan
                <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-neutral-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-neutral-900">Scratch Challenge</span>
            </div>
            <p className="text-center text-neutral-500 text-sm">
              Platform pembelajaran coding untuk anak-anak Indonesia
            </p>
            <div className="flex items-center gap-4 text-sm text-neutral-500">
              <span>Made with {"<3"} for Indonesian kids</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, color }: { icon: React.ComponentType<{className?: string}>; title: string; desc: string; color: "primary" | "secondary" | "accent" }) {
  const colorClasses = {
    primary: "bg-primary-100 text-primary-600",
    secondary: "bg-secondary-100 text-secondary-600",
    accent: "bg-accent-100 text-accent-600",
  }
  return (
    <div className="group bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", colorClasses[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-lg font-bold text-neutral-900 mb-2">{title}</h4>
      <p className="text-neutral-600 leading-relaxed">{desc}</p>
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
    <article className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden animate-pulse">
      <div className="aspect-video bg-neutral-200" />
      <div className="p-5 space-y-3">
        <div className="h-6 bg-neutral-200 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 rounded w-full" />
        <div className="h-4 bg-neutral-200 rounded w-2/3" />
        <div className="h-4 bg-neutral-200 rounded w-1/2" />
        <div className="h-8 bg-neutral-200 rounded w-full mt-4" />
      </div>
    </article>
  )
}