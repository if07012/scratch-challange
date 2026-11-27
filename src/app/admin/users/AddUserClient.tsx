'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { LogoutButton } from '@/components/LogoutButton'

export function AddUserClient() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setCreated('')
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const result = await response.json()
    setLoading(false)
    if (!response.ok) {
      setError(result.error || 'Gagal membuat akun')
      return
    }
    setCreated(result.user.email)
    setForm({ email: '', password: '' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900">Kelola User</h1>
          <div className="flex items-center gap-3">
            <LogoutButton />
            <Link href="/admin" className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"><ArrowLeft className="h-4 w-4" />Kembali</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mb-5 text-sm text-gray-600">Buat akun user baru, lalu berikan email dan password kepada pengguna tersebut.</p>
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
          {created && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">Akun {created} berhasil dibuat.</div>}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input id="email" type="email" autoComplete="off" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input id="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
              <p className="mt-1 text-xs text-gray-500">Minimal 8 karakter.</p>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60">{loading ? 'Menyimpan...' : 'Buat Akun User'}</button>
          </div>
        </form>
      </main>
    </div>
  )
}
