import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AddUserClient } from './AddUserClient'

export const dynamic = 'force-dynamic'

export default async function AddUserPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }
  if (user.app_metadata?.role !== 'admin') {
    redirect('/admin')
  }

  return <AddUserClient />
}
