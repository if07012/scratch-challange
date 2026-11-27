'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button type="button" onClick={handleLogout} className={className ?? 'flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50'}>
      <LogOut className="h-4 w-4" />Keluar
    </button>
  )
}
