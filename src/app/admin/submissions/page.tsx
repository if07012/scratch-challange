import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCategories, getAdminSubmissions } from '@/lib/supabase/queries'
import { SubmissionsClient } from './SubmissionsClient'

export const dynamic = 'force-dynamic'

export default async function AdminSubmissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }
  if (user.app_metadata?.role !== 'admin') {
    redirect('/')
  }

  const [submissions, categories] = await Promise.all([
    getAdminSubmissions(),
    getCategories(),
  ])

  return <SubmissionsClient submissions={submissions} categories={categories} />
}
