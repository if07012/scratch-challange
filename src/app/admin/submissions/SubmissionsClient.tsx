'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, Download, Search, CheckCircle2, Clock, Trash2 } from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import { cn } from '@/lib/utils'
import type { AdminSubmission, Category } from '@/lib/supabase/types'

const inputClass = 'w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition'

function downloadHref(submission: AdminSubmission) {
  const url = submission.submitted_scratch_url
  if (!url) return null
  const name = submission.submitted_scratch_name || 'project.sb3'
  return url.startsWith('/api/upload?')
    ? `${url}&name=${encodeURIComponent(name)}`
    : url
}

export function SubmissionsClient({ submissions, categories }: { submissions: AdminSubmission[]; categories: Category[] }) {
  const [rows, setRows] = useState(submissions)
  const [deleting, setDeleting] = useState('')
  const [search, setSearch] = useState('')
  const [exerciseFilter, setExerciseFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [onlySubmitted, setOnlySubmitted] = useState(false)

  const exercises = useMemo(() => {
    const seen = new Map<string, string>()
    rows.forEach((item) => seen.set(item.exercise_id, item.exercise_title))
    return Array.from(seen, ([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title))
  }, [rows])

  const filtered = rows.filter((item) => {
    const query = search.toLowerCase()
    const matchesSearch = !query
      || item.exercise_title.toLowerCase().includes(query)
      || (item.email || '').toLowerCase().includes(query)
      || (item.submitted_scratch_name || '').toLowerCase().includes(query)
    const matchesExercise = exerciseFilter === 'all' || item.exercise_id === exerciseFilter
    const matchesCategory = categoryFilter === 'all' || item.category_id === categoryFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesSubmitted = !onlySubmitted || Boolean(item.submitted_scratch_url)
    return matchesSearch && matchesExercise && matchesCategory && matchesStatus && matchesSubmitted
  })

  const submittedCount = rows.filter((item) => item.submitted_scratch_url).length
  const completedCount = rows.filter((item) => item.status === 'completed').length
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Tanpa Kategori'
    return categories.find((category) => category.id === categoryId)?.name || 'Tanpa Kategori'
  }

  const handleDelete = async (item: AdminSubmission) => {
    if (!confirm(`Hapus file unggahan ${item.email || 'siswa ini'} untuk "${item.exercise_title}"? File akan dihapus permanen.`)) return
    const key = `${item.user_id}-${item.exercise_id}`
    setDeleting(key)
    try {
      const response = await fetch('/api/submissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: item.user_id, exercise_id: item.exercise_id }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'Gagal menghapus unggahan')
      setRows((current) => current.map((row) => row.user_id === item.user_id && row.exercise_id === item.exercise_id
        ? { ...row, submitted_scratch_url: null, submitted_scratch_name: null, submitted_at: null }
        : row))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal menghapus unggahan')
    } finally {
      setDeleting('')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-base font-bold text-neutral-900">Hasil Pekerjaan Siswa</h1>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-50 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
            <LogoutButton className="hidden sm:inline-block text-sm font-medium text-neutral-600 hover:text-neutral-900" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {[
            { label: 'Total Pengerjaan', value: submissions.length, icon: Clock, color: 'bg-primary-100 text-primary-600' },
            { label: 'Sudah Unggah File', value: submittedCount, icon: Download, color: 'bg-secondary-100 text-secondary-600' },
            { label: 'Selesai', value: completedCount, icon: CheckCircle2, color: 'bg-success-100 text-success-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{value}</p>
                <p className="text-sm text-neutral-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari siswa, latihan, atau nama file..." className={inputClass + ' pl-10'} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center">
            <select value={exerciseFilter} onChange={(event) => setExerciseFilter(event.target.value)} className={inputClass}>
              <option value="all">Semua Latihan</option>
              {exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.title}</option>)}
            </select>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={inputClass}>
              <option value="all">Semua Kategori</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClass}>
              <option value="all">Semua Status</option>
              <option value="in_progress">Dikerjakan</option>
              <option value="completed">Selesai</option>
            </select>
            <label className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-medium text-neutral-700">
              <input type="checkbox" checked={onlySubmitted} onChange={(event) => setOnlySubmitted(event.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
              Ada file
            </label>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  {['Siswa', 'Latihan', 'Checklist', 'Status', 'File Terakhir', 'Terakhir Diperbarui', 'Aksi'].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((item) => {
                  const href = downloadHref(item)
                  return (
                    <tr key={`${item.user_id}-${item.exercise_id}`} className="text-neutral-700 hover:bg-neutral-50/70 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-neutral-900 break-all">{item.email || item.user_id}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-neutral-900">{item.exercise_title}</div>
                        <div className="text-sm text-neutral-500">{getCategoryName(item.category_id)}</div>
                      </td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap">
                        {item.checklist_done}/{item.checklist_total}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                          item.status === 'completed' ? 'bg-success-100 text-success-700 ring-1 ring-success-200' : 'bg-accent-100 text-accent-700 ring-1 ring-accent-200'
                        )}>
                          {item.status === 'completed' ? 'Selesai' : 'Dikerjakan'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {item.submitted_scratch_name
                          ? <span className="break-all text-neutral-800">{item.submitted_scratch_name}</span>
                          : <span className="text-neutral-400">Belum ada</span>}
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600 whitespace-nowrap">
                        {item.submitted_at
                          ? new Date(item.submitted_at).toLocaleString('id-ID')
                          : <span className="text-neutral-400">-</span>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {href
                            ? <a href={href} download={item.submitted_scratch_name || 'project.sb3'} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"><Download className="h-4 w-4" />Unduh</a>
                            : <span className="px-2.5 text-sm text-neutral-400">-</span>}
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={!href || deleting === `${item.user_id}-${item.exercise_id}`}
                            title={href ? 'Hapus unggahan' : 'Tidak ada file'}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />{deleting === `${item.user_id}-${item.exercise_id}` ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">Belum ada data pengerjaan yang cocok.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
