'use client'

import { cn, getGoogleDriveMediaUrl, getThumbnailSrc } from '@/lib/utils'
import {
  Download,
  Play,
  CheckSquare,
  BookOpen,
  Clock,
  FileCode,
  ChevronLeft,
  Upload,
  CheckCircle2,
  Target,
  ListChecks,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { difficultyConfig } from '@/lib/design-system'
import type { ExerciseWithCategory } from '@/lib/supabase/types'

interface ExerciseDetailClientProps {
  exercise: ExerciseWithCategory
}

type TabId = 'case' | 'download' | 'video' | 'checklist' | 'upload'

function sanitizeCaseHtml(html: string) {
  if (typeof window === 'undefined') return ''
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  parsed.querySelectorAll('script, style, iframe, object, embed, form, input, button').forEach((element) => element.remove())

  const allowedTags = new Set(['P', 'DIV', 'SPAN', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A'])
  parsed.body.querySelectorAll('*').forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes))
      return
    }

    const href = element.tagName === 'A' ? element.getAttribute('href') || '' : ''
    Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name))
    if (element.tagName === 'A') {
      if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
        element.removeAttribute('href')
      } else {
        element.setAttribute('href', href)
        element.setAttribute('target', '_blank')
        element.setAttribute('rel', 'noopener noreferrer')
      }
    }
  })

  return parsed.body.innerHTML
}

export function ExerciseDetailClient({ exercise }: ExerciseDetailClientProps) {
  const searchParams = useSearchParams()
  const requestedBackPath = searchParams.get('from') || '/'
  const backPath = requestedBackPath.startsWith('/') && !requestedBackPath.startsWith('//') ? requestedBackPath : '/'
  const [activeTab, setActiveTab] = useState<TabId>('case')
  const [userId, setUserId] = useState<string | null>(null)
  const [exerciseStatus, setExerciseStatus] = useState<'in_progress' | 'completed'>('in_progress')
  const [completedChecklistIds, setCompletedChecklistIds] = useState<Set<string>>(new Set())
  const [progressLoading, setProgressLoading] = useState(true)
  const [progressSaving, setProgressSaving] = useState(false)
  const [submittedFileUrl, setSubmittedFileUrl] = useState<string | null>(null)
  const [submittedFileName, setSubmittedFileName] = useState<string | null>(null)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true

    async function loadProgress() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (!user) {
        setProgressLoading(false)
        return
      }

      setUserId(user.id)
      const [{ data: progress }, { data: checklistItems }] = await Promise.all([
        supabase.from('student_progress').select('status, submitted_scratch_url, submitted_scratch_name, submitted_at').eq('user_id', user.id).eq('exercise_id', exercise.id).maybeSingle(),
        supabase.from('student_checklist_progress').select('checklist_id').eq('user_id', user.id),
      ])

      if (!mounted) return
      setExerciseStatus(progress?.status === 'completed' ? 'completed' : 'in_progress')
      setSubmittedFileUrl(progress?.submitted_scratch_url ?? null)
      setSubmittedFileName(progress?.submitted_scratch_name ?? null)
      setSubmittedAt(progress?.submitted_at ?? null)
      const validIds = new Set(exercise.checklists.map((item) => item.id))
      setCompletedChecklistIds(new Set((checklistItems || []).map((item) => item.checklist_id).filter((id) => validIds.has(id))))
      setProgressLoading(false)
    }

    loadProgress()
    return () => { mounted = false }
  }, [exercise.id, exercise.checklists, supabase])

  async function updateExerciseStatus(status: 'in_progress' | 'completed') {
    if (!userId) return
    setProgressSaving(true)
    const { error } = await supabase.from('student_progress').upsert({
      user_id: userId,
      exercise_id: exercise.id,
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,exercise_id' })
    if (!error) setExerciseStatus(status)
    setProgressSaving(false)
  }

  async function toggleChecklist(checklistId: string, completed: boolean) {
    if (!userId) return
    setProgressSaving(true)
    if (completed) {
      const { error } = await supabase.from('student_checklist_progress').upsert({
        user_id: userId,
        checklist_id: checklistId,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,checklist_id' })
      if (!error) setCompletedChecklistIds((current) => new Set(current).add(checklistId))
    } else {
      const { error } = await supabase
        .from('student_checklist_progress')
        .delete()
        .eq('user_id', userId)
        .eq('checklist_id', checklistId)
      if (!error) setCompletedChecklistIds((current) => {
        const next = new Set(current)
        next.delete(checklistId)
        return next
      })
    }
    setProgressSaving(false)
  }

  async function uploadSubmission(file: File) {
    if (!userId) return
    setUploadError(null)
    setProgressSaving(true)

    const form = new FormData()
    form.append('file', file)
    form.append('kind', 'scratch')
    const response = await fetch('/api/upload', { method: 'POST', body: form })
    const result = await response.json() as { url?: string; error?: string }
    if (!response.ok || !result.url) {
      setUploadError(result.error || 'Gagal mengunggah file Scratch')
      setProgressSaving(false)
      return
    }

    const submittedAtValue = new Date().toISOString()
    const { error } = await supabase.from('student_progress').upsert({
      user_id: userId,
      exercise_id: exercise.id,
      status: exerciseStatus,
      completed_at: exerciseStatus === 'completed' ? submittedAtValue : null,
      submitted_scratch_url: result.url,
      submitted_scratch_name: file.name,
      submitted_at: submittedAtValue,
    }, { onConflict: 'user_id,exercise_id' })

    if (error) {
      setUploadError(error.message)
    } else {
      setSubmittedFileUrl(result.url)
      setSubmittedFileName(file.name)
      setSubmittedAt(submittedAtValue)
    }
    setProgressSaving(false)
  }

  async function deleteSubmission() {
    if (!userId) return
    if (!confirm('Hapus file yang sudah kamu unggah? File akan dihapus permanen.')) return
    setUploadError(null)
    setProgressSaving(true)
    const response = await fetch('/api/submissions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exercise_id: exercise.id }),
    })
    const result = await response.json() as { error?: string }
    if (!response.ok) {
      setUploadError(result.error || 'Gagal menghapus file Scratch')
    } else {
      setSubmittedFileUrl(null)
      setSubmittedFileName(null)
      setSubmittedAt(null)
    }
    setProgressSaving(false)
  }

  const videoUrl = getGoogleDriveMediaUrl(exercise.video_url, 'video') || exercise.video_url
  const scratchFileName = exercise.scratch_file_name?.trim() || 'project.sb3'
  const downloadFileName = /\.sb3$/i.test(scratchFileName) ? scratchFileName : `${scratchFileName}.sb3`
  const scratchDownloadUrl = exercise.scratch_file_url?.startsWith('/api/upload?')
    ? `${exercise.scratch_file_url.replace(/[?&]name=[^&]*$/, '')}&name=${encodeURIComponent(downloadFileName)}`
    : exercise.scratch_file_url

  const diffConfig = difficultyConfig[exercise.difficulty] || difficultyConfig.beginner

  const fileTypeNames = {
    starter: 'Starter Project',
    partial: 'Partial Project',
    blank: 'Blank Project',
  }

  const fileTypeDescriptions = {
    starter: 'Project awal dengan sprite dan background, logika belum lengkap',
    partial: 'Project dengan beberapa blok kode tersedia',
    blank: 'Project kosong untuk dikerjakan dari awal',
  }

  const tabOptions: { id: TabId; label: string; icon: LucideIcon; hidden?: boolean }[] = [
    { id: 'case', label: 'Deskripsi Kasus', icon: BookOpen },
    { id: 'download', label: 'Unduh File', icon: Download },
    { id: 'video', label: 'Video Hasil', icon: Play },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
    { id: 'upload', label: 'Unggah Scratch', icon: Upload, hidden: !userId },
  ]

  const category = exercise.categories
  const caseHtml = sanitizeCaseHtml(exercise.case_description || '')
  const totalChecklists = exercise.checklists.length
  const completedCount = exercise.checklists.filter((item) => completedChecklistIds.has(item.id)).length
  const checklistPercent = totalChecklists > 0 ? Math.round((completedCount / totalChecklists) * 100) : 0
  const thumbnailUrl = getThumbnailSrc(exercise.thumbnail_url)

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-neutral-900">Scratch Challenge</span>
            </Link>
            <Link href="/admin" className="text-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors">Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 p-6 sm:p-10 animate-fade-in">
          <div className="absolute inset-0 bg-[var(--pattern-grid)] opacity-50" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
            <div>
              <Link href={backPath} className="inline-flex items-center gap-1 text-sm font-medium text-primary-100 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </Link>
              <h1 className="mt-3 text-2xl sm:text-4xl font-bold text-white leading-tight">{exercise.title}</h1>
              {exercise.short_description && (
                <p className="mt-3 text-primary-100 text-base sm:text-lg max-w-2xl">{exercise.short_description}</p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {category && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/15 text-white ring-1 ring-white/20">
                    {category.name}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-white/15 text-white ring-1 ring-white/20">
                  <span aria-hidden="true">{diffConfig.icon}</span> {diffConfig.label}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-white/15 text-white ring-1 ring-white/20">
                  <Clock className="w-4 h-4" /> {exercise.estimated_minutes} menit
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-white/15 text-white ring-1 ring-white/20">
                  <FileCode className="w-4 h-4" /> {fileTypeNames[exercise.scratch_file_type]}
                </span>
              </div>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden bg-primary-900/40 ring-1 ring-white/20 shadow-2xl">
              {thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  alt={exercise.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 380px, 100vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white/40" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Status strip */}
        <section className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex items-center gap-4">
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
              exerciseStatus === 'completed' ? 'bg-success-100 text-success-600' : 'bg-accent-100 text-accent-600'
            )}>
              {exerciseStatus === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-neutral-500">Status latihan</p>
              <p className="font-semibold text-neutral-900">
                {userId ? (exerciseStatus === 'completed' ? 'Selesai' : 'Belum selesai') : 'Belum login'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-neutral-500">Checklist</span>
              <span className="font-semibold text-neutral-900">{completedCount}/{totalChecklists}</span>
            </div>
            <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
                style={{ width: `${checklistPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-500">{checklistPercent}% pemeriksaan selesai</p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex items-center">
            {userId ? (
              <button
                type="button"
                disabled={progressLoading || progressSaving}
                onClick={() => updateExerciseStatus(exerciseStatus === 'completed' ? 'in_progress' : 'completed')}
                className={cn(
                  'w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed',
                  exerciseStatus === 'completed'
                    ? 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                    : 'bg-success-600 text-white hover:bg-success-700 shadow-sm'
                )}
              >
                <CheckCircle2 className="w-5 h-5" />
                {exerciseStatus === 'completed' ? 'Tandai belum selesai' : 'Tandai latihan selesai'}
              </button>
            ) : !progressLoading ? (
              <Link href="/login" className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm">
                <ShieldCheck className="w-5 h-5" />
                Login untuk simpan progress
              </Link>
            ) : (
              <div className="h-11 w-full bg-neutral-100 rounded-xl animate-pulse" />
            )}
          </div>
        </section>

        {/* Tabs */}
        <nav className="mt-6 bg-white rounded-2xl border border-neutral-200 shadow-sm p-1.5 flex gap-1 overflow-x-auto" aria-label="Tabs">
          {tabOptions.filter((tab) => !tab.hidden).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all',
                activeTab === id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              )}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div className="mt-4 bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 sm:p-7 animate-fade-in">
          {activeTab === 'case' && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <div className="exercise-case-heading rounded-xl border border-primary-200 mb-4">
                  <div className="exercise-case-heading-icon">📖</div>
                  <div>
                    <p className="exercise-case-kicker">Deskripsi Kasus</p>
                    <h2 className="exercise-case-title">Cermati tantangan ini</h2>
                  </div>
                </div>
                {caseHtml ? (
                  <article className="exercise-case-content" dangerouslySetInnerHTML={{ __html: caseHtml }} />
                ) : (
                  <p className="rounded-xl bg-neutral-50 px-5 py-4 text-neutral-600">Deskripsi kasus belum tersedia.</p>
                )}
              </div>

              <aside className="space-y-4">
                {exercise.learning_objectives.length > 0 && (
                  <div className="rounded-2xl border border-secondary-200 bg-secondary-50/60 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-secondary-600" />
                      <h3 className="font-semibold text-neutral-900">Tujuan Belajar</h3>
                    </div>
                    <ul className="space-y-2">
                      {exercise.learning_objectives.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-neutral-700">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-secondary-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {exercise.instructions.length > 0 && (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <ListChecks className="w-5 h-5 text-primary-600" />
                      <h3 className="font-semibold text-neutral-900">Langkah Pengerjaan</h3>
                    </div>
                    <ol className="space-y-2">
                      {exercise.instructions.map((item, index) => (
                        <li key={item} className="flex gap-3 text-sm text-neutral-700">
                          <span className="w-5 h-5 shrink-0 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">{index + 1}</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </aside>
            </div>
          )}

          {activeTab === 'download' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-secondary-50 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                    <FileCode className="w-7 h-7 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-neutral-900 break-all">{downloadFileName}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-xs font-medium ring-1 ring-neutral-200">
                        {fileTypeNames[exercise.scratch_file_type]}
                      </span>
                      <span className="text-xs">{fileTypeDescriptions[exercise.scratch_file_type]}</span>
                    </div>
                  </div>
                  {exercise.scratch_file_url && (
                    <a
                      href={scratchDownloadUrl || exercise.scratch_file_url}
                      download={downloadFileName}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold shadow-sm shrink-0"
                    >
                      <Download className="w-5 h-5" />
                      Unduh .sb3
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
                <h4 className="font-semibold text-neutral-900 mb-3">Cara Membuka File .sb3</h4>
                <ol className="space-y-2.5 text-sm text-neutral-700">
                  <li className="flex gap-3"><span className="w-5 h-5 shrink-0 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">1</span><span>Buka <a href="https://scratch.mit.edu" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">scratch.mit.edu</a></span></li>
                  <li className="flex gap-3"><span className="w-5 h-5 shrink-0 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">2</span><span>Klik &quot;Create&quot; di menu atas</span></li>
                  <li className="flex gap-3"><span className="w-5 h-5 shrink-0 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">3</span><span>Klik menu &quot;File&quot; → &quot;Load from your computer&quot;</span></li>
                  <li className="flex gap-3"><span className="w-5 h-5 shrink-0 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">4</span><span>Pilih file <code className="bg-neutral-200 px-1.5 py-0.5 rounded text-xs break-all">{downloadFileName}</code> yang sudah diunduh</span></li>
                  <li className="flex gap-3"><span className="w-5 h-5 shrink-0 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">5</span><span>Mulai mengerjakan tantangan!</span></li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-5">
              <div className="aspect-video bg-neutral-900 rounded-2xl overflow-hidden ring-1 ring-neutral-200">
                {videoUrl ? (
                  exercise.video_type === 'youtube' && videoUrl.includes('youtube.com/watch?v=') ? (
                    <iframe
                      src={videoUrl.replace('watch?v=', 'embed/')}
                      title={exercise.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : exercise.video_type === 'youtube' && videoUrl.includes('youtube.com/embed/') ? (
                    <iframe
                      src={videoUrl}
                      title={exercise.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    <video
                      src={videoUrl}
                      poster={thumbnailUrl || undefined}
                      controls
                      preload="metadata"
                      onError={(event) => {
                        const video = event.currentTarget
                        if (!video.dataset.fallback && exercise.video_url) {
                          video.dataset.fallback = 'true'
                          video.src = exercise.video_url
                        }
                      }}
                      className="w-full h-full"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500">
                    <Play className="w-12 h-12" />
                    <p className="ml-3">Video tidak tersedia</p>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 flex gap-3 text-sm text-neutral-700">
                <Play className="w-5 h-5 shrink-0 text-primary-600" />
                <p>Tonton video ini untuk melihat bagaimana hasil akhir program seharusnya berjalan. Bandingkan dengan pekerjaanmu!</p>
              </div>
            </div>
          )}

          {activeTab === 'upload' && userId && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Unggah hasil pekerjaan Scratch</h3>
                <p className="mt-1 text-sm text-neutral-600">Pilih file <strong>.sb3</strong> dari project yang sudah kamu kerjakan.</p>
              </div>

              {submittedFileUrl && (
                <div className="rounded-2xl border border-success-200 bg-success-50 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-success-600" />
                    <div className="min-w-0">
                      <p className="font-semibold text-success-800">File terakhir berhasil disimpan</p>
                      <p className="mt-1 text-sm text-success-700 break-all">{submittedFileName}</p>
                      {submittedAt && (
                        <p className="mt-1 text-xs text-success-700">Diunggah {new Date(submittedAt).toLocaleString('id-ID')}</p>
                      )}
                      <a href={submittedFileUrl} download={submittedFileName || 'project.sb3'} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-success-700 underline">
                        <Download className="w-4 h-4" />
                        Unduh hasil unggahan
                      </a>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={deleteSubmission}
                          disabled={progressSaving}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Hapus file
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {uploadError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {uploadError}
                </div>
              )}

              <label className="block rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/40 transition-colors">
                <Upload className="mx-auto h-10 w-10 text-neutral-400" />
                <span className="mt-3 block text-sm font-semibold text-neutral-800">Pilih file Scratch (.sb3)</span>
                <span className="mt-1 block text-xs text-neutral-500">Klik untuk memilih file dari perangkatmu</span>
                <input
                  type="file"
                  accept=".sb3"
                  disabled={progressSaving}
                  className="mt-4 block w-full text-sm text-neutral-600 file:mr-4 file:rounded-xl file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-primary-700 disabled:opacity-60"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void uploadSubmission(file)
                    event.target.value = ''
                  }}
                />
              </label>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-neutral-900">Periksa pekerjaanmu</h4>
                <span className="text-sm font-semibold text-primary-600">{completedCount}/{totalChecklists}</span>
              </div>

              {progressLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-neutral-100 rounded-xl animate-pulse" />)}
                </div>
              ) : exercise.checklists.length > 0 ? (
                <ul className="space-y-3">
                  {exercise.checklists.map((item) => {
                    const completed = completedChecklistIds.has(item.id)
                    return (
                      <li key={item.id} className={cn(
                        'flex items-start gap-3 p-4 rounded-xl border transition-colors',
                        completed ? 'bg-success-50 border-success-200' : 'bg-neutral-50 border-neutral-200'
                      )}>
                        <input
                          type="checkbox"
                          id={`check-${item.id}`}
                          checked={completed}
                          disabled={!userId || progressSaving}
                          onChange={(event) => toggleChecklist(item.id, event.target.checked)}
                          className="mt-0.5 w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 disabled:cursor-not-allowed"
                        />
                        <label htmlFor={`check-${item.id}`} className={cn('cursor-pointer text-sm', completed ? 'text-success-800 line-through' : 'text-neutral-700')}>
                          {item.description}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-neutral-500 text-center py-8">Belum ada checklist untuk latihan ini.</p>
              )}

              <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                Centang semua item di atas jika hasil pekerjaanmu sudah sesuai.
                Jika ada yang belum, coba perbaiki kode Scratch-mu dan bandingkan lagi dengan video!
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-neutral-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-neutral-500 text-sm">
            Scratch Challenge - Platform pembelajaran coding untuk anak-anak
          </p>
        </div>
      </footer>
    </div>
  )
}
