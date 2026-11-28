'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, AlertCircle, LogIn, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const inputClass = 'w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 sm:py-2.5 text-base sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition'
const labelClass = 'block text-sm font-semibold text-neutral-700 mb-1.5'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-50 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-100/60 via-neutral-50 to-secondary-100/60" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
        </Link>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xl shadow-neutral-900/5 sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 shadow-lg shadow-primary-600/20">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">Login Admin</h1>
            <p className="mt-1.5 text-sm text-neutral-600">Masuk untuk mengelola latihan Scratch.</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input id="email" type="email" autoComplete="email" required placeholder="nama@sekolah.id" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <input id="password" type="password" autoComplete="current-password" required placeholder="Masukkan password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
