'use client'

import Link from 'next/link'
import { ArrowLeft, UserPlus, Users, CheckCircle2, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { LogoutButton } from '@/components/LogoutButton'

const inputClass = 'w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 sm:py-2.5 text-base sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition'
const labelClass = 'block text-sm font-semibold text-neutral-700 mb-1.5'

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
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-neutral-900 leading-tight">Kelola User</h1>
              <p className="text-xs text-neutral-500">Scratch Challenge</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-50 transition-colors">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Kembali</span>
            </Link>
            <LogoutButton className="hidden sm:inline-block text-sm font-medium text-neutral-600 hover:text-neutral-900" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Tambah Akun User</h2>
            <p className="text-sm text-neutral-500">Buat akun baru untuk pengguna</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-5">
          <p className="text-sm text-neutral-600">Buat akun user baru, lalu berikan email dan password kepada pengguna tersebut.</p>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {created && (
            <div className="flex items-start gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700" role="status">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Akun {created} berhasil dibuat.</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" type="email" autoComplete="off" required placeholder="nama@sekolah.id" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <input id="password" type="password" autoComplete="new-password" required minLength={8} placeholder="Minimal 8 karakter" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={inputClass} />
            <p className="mt-1.5 text-xs text-neutral-500">Minimal 8 karakter.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors shadow-sm sm:py-2.5"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Menyimpan...' : 'Buat Akun User'}
          </button>

          <div className="sm:hidden">
            <LogoutButton className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors" />
          </div>
        </form>
      </main>
    </div>
  )
}
