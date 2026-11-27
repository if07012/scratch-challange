import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCategories, getAllExercisesAdmin } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { isGoogleDriveConfigured } from '@/lib/google-drive'
import { AdminDashboardClient } from './AdminDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard({
    searchParams,
}: {
    searchParams: Promise<{ google?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }
    if (user.app_metadata?.role !== 'admin') {
        redirect('/')
    }

    const [categories, exercises, { google }] = await Promise.all([
        getCategories(),
        getAllExercisesAdmin(),
        searchParams,
    ])

    return (
        <Suspense fallback={<AdminDashboardSkeleton />}>
            <AdminDashboardClient
                categories={categories}
                exercises={exercises}
                googleResult={google}
                driveConfigured={isGoogleDriveConfigured()}
            />
        </Suspense>
    )
}

function AdminDashboardSkeleton() {
    return (
        <div className="min-h-screen bg-neutral-50">
            <header className="bg-white border-b border-neutral-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-neutral-200 animate-pulse rounded-xl" />
                            <div className="h-5 w-32 bg-neutral-200 animate-pulse rounded" />
                        </div>
                        <div className="h-9 w-36 bg-neutral-200 animate-pulse rounded-xl" />
                    </div>
                </div>
            </header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 bg-white border border-neutral-200 rounded-2xl" />
                        ))}
                    </div>
                    <div className="h-28 bg-white border border-neutral-200 rounded-2xl" />
                    <div className="h-11 bg-white border border-neutral-200 rounded-xl" />
                    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                        <div className="h-12 bg-neutral-50 border-b border-neutral-200" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between gap-4 px-4 py-4 border-b border-neutral-100 last:border-0">
                                <div className="h-4 bg-neutral-200 rounded w-1/3" />
                                <div className="h-6 bg-neutral-200 rounded-full w-24" />
                                <div className="h-6 bg-neutral-200 rounded-full w-20" />
                                <div className="h-6 bg-neutral-200 rounded-full w-24" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
