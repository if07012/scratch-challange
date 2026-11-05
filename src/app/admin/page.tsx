import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCategories, getAllExercisesAdmin } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from './AdminDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const [categories, exercises] = await Promise.all([
        getCategories(),
        getAllExercisesAdmin(),
    ])

    return (
        <Suspense fallback={<AdminDashboardSkeleton />}>
            <AdminDashboardClient categories={categories} exercises={exercises} />
        </Suspense>
    )
}

function AdminDashboardSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
                            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
                        </div>
                    </div>
                </div>
            </header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="h-10 bg-gray-200 rounded w-full" />
                                <div className="h-10 bg-gray-200 rounded w-full" />
                                <div className="h-10 bg-gray-200 rounded w-full" />
                                <div className="h-10 bg-gray-200 rounded w-full" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tingkat</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terupdate</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {[1, 2, 3].map(i => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                <div className="h-3 bg-gray-200 rounded w-1/2 mt-1" />
                                            </td>
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-1/2" /></td>
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-1/2" /></td>
                                            <td className="px-4 py-4"><div className="h-5 bg-gray-200 rounded w-1/3" /></td>
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-1/3" /></td>
                                            <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-1/3" /></td>
                                            <td className="px-4 py-4 text-right"><div className="h-6 bg-gray-200 rounded w-24" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}