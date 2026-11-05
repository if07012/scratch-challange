'use client'

import { cn, getGoogleDriveMediaUrl } from '@/lib/utils'
import {
  Download,
  Play,
  CheckSquare,
  BookOpen,
  Clock,
  FileCode,
  ChevronLeft,
  Upload,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ExerciseWithCategory } from '@/lib/supabase/types'

interface ExerciseDetailClientProps {
  exercise: ExerciseWithCategory
}

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
  const [activeTab, setActiveTab] = useState<'case' | 'download' | 'video' | 'checklist' | 'upload'>('case')
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

  const videoUrl = getGoogleDriveMediaUrl(exercise.video_url, 'video') || exercise.video_url
  const scratchFileName = exercise.scratch_file_name?.trim() || 'project.sb3'
  const downloadFileName = /\.sb3$/i.test(scratchFileName) ? scratchFileName : `${scratchFileName}.sb3`
  const scratchDownloadUrl = exercise.scratch_file_url?.startsWith('/api/upload?')
    ? `${exercise.scratch_file_url.replace(/[?&]name=[^&]*$/, '')}&name=${encodeURIComponent(downloadFileName)}`
    : exercise.scratch_file_url

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-blue-100 text-blue-700',
    advanced: 'bg-purple-100 text-purple-700',
  }

  const difficultyNames = {
    beginner: 'Pemula',
    intermediate: 'Menengah',
    advanced: 'Lanjutan',
  }

  const fileTypeColors = {
    starter: 'bg-blue-100 text-blue-700',
    partial: 'bg-yellow-100 text-yellow-700',
    blank: 'bg-gray-100 text-gray-700',
  }

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

  const category = exercise.categories
  const caseHtml = sanitizeCaseHtml(exercise.case_description || '')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href={backPath} className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </Link>
              <h1 className="text-xl font-bold text-gray-900">{exercise.title}</h1>
            </div>
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {category && (
              <span className={cn('px-3 py-1 text-sm font-medium rounded-full', category.color_class)}>
                {category.name}
              </span>
            )}
            <span className={cn('px-3 py-1 text-sm font-medium rounded-full', difficultyColors[exercise.difficulty])}>
              {difficultyNames[exercise.difficulty]}
            </span>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {exercise.estimated_minutes} menit
            </span>
            <span className={cn('px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1', fileTypeColors[exercise.scratch_file_type])}>
              <FileCode className="w-3 h-3" />
              {fileTypeNames[exercise.scratch_file_type]}
            </span>
          </div>
          <p className="text-gray-600">{exercise.short_description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {userId ? (
              <>
                <span className={cn('px-3 py-1 text-sm font-medium rounded-full', exerciseStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                  {exerciseStatus === 'completed' ? '✓ Latihan selesai' : 'Belum selesai'}
                </span>
                <button
                  type="button"
                  disabled={progressLoading || progressSaving}
                  onClick={() => updateExerciseStatus(exerciseStatus === 'completed' ? 'in_progress' : 'completed')}
                  className={cn('rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60', exerciseStatus === 'completed' ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50' : 'bg-green-600 text-white hover:bg-green-700')}
                >
                  {exerciseStatus === 'completed' ? 'Tandai belum selesai' : 'Tandai latihan selesai'}
                </button>
              </>
            ) : !progressLoading ? (
              <Link href="/login" className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                Login untuk menyimpan progress
              </Link>
            ) : null}
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-1" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('case')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                activeTab === 'case'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <BookOpen className="w-4 h-4 inline mr-1" /> Deskripsi Kasus
            </button>
            <button
              onClick={() => setActiveTab('download')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                activeTab === 'download'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Download className="w-4 h-4 inline mr-1" /> Unduh File
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                activeTab === 'video'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Play className="w-4 h-4 inline mr-1" /> Video Hasil
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                activeTab === 'checklist'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <CheckSquare className="w-4 h-4 inline mr-1" /> Checklist
            </button>
            {userId && (
              <button
                onClick={() => setActiveTab('upload')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                  activeTab === 'upload'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Upload className="w-4 h-4 inline mr-1" /> Unggah Scratch
              </button>
            )}
          </nav>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === 'case' && (
            <div className="exercise-case-card">
              <div className="exercise-case-heading">
                <div className="exercise-case-heading-icon">📖</div>
                <div>
                  <p className="exercise-case-kicker">Deskripsi Kasus</p>
                  <h2 className="exercise-case-title">Cermati tantangan ini</h2>
                </div>
              </div>
              {caseHtml ? (
                <article
                  className="exercise-case-content"
                  dangerouslySetInnerHTML={{ __html: caseHtml }}
                />
              ) : (
                <p className="rounded-xl bg-gray-50 px-5 py-4 text-gray-600">Deskripsi kasus belum tersedia.</p>
              )}
            </div>
          )}

          {activeTab === 'download' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FileCode className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{downloadFileName}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      {exercise.scratch_file_url && (
                        <a
                          href={scratchDownloadUrl || exercise.scratch_file_url}
                          download={downloadFileName}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <Download className="w-5 h-5" />
                          Unduh Project Scratch (.sb3)
                        </a>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-gray-600">
                      Tipe file: <strong>{fileTypeNames[exercise.scratch_file_type]}</strong> - {fileTypeDescriptions[exercise.scratch_file_type]}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Cara Membuka File .sb3</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
                  <li>Buka <a href="https://scratch.mit.edu" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">scratch.mit.edu</a></li>
                  <li>Klik &quot;Create&quot; di menu atas</li>
                  <li>Klik menu &quot;File&quot; → &quot;Load from your computer&quot;</li>
                  <li>Pilih file <code className="bg-gray-200 px-1 rounded">{downloadFileName}</code> yang sudah diunduh</li>
                  <li>Mulai mengerjakan tantangan!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-6">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
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
                      poster={getGoogleDriveMediaUrl(exercise.thumbnail_url, 'thumbnail') || exercise.thumbnail_url || undefined}
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
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Play className="w-16 h-16" />
                    <p className="ml-4">Video tidak tersedia</p>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Tonton video ini untuk melihat bagaimana hasil akhir program seharusnya berjalan. Bandingkan dengan pekerjaanmu!</p>
              </div>
            </div>
          )}

          {activeTab === 'upload' && userId && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Unggah hasil pekerjaan Scratch</h3>
                <p className="mt-1 text-sm text-gray-600">Pilih file <strong>.sb3</strong> dari project yang sudah kamu kerjakan.</p>
              </div>

              {submittedFileUrl && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="font-medium text-green-800">File terakhir berhasil disimpan</p>
                  <p className="mt-1 text-sm text-green-700">{submittedFileName}</p>
                  {submittedAt && (
                    <p className="mt-1 text-xs text-green-700">Diunggah {new Date(submittedAt).toLocaleString('id-ID')}</p>
                  )}
                  <a href={submittedFileUrl} download={submittedFileName || 'project.sb3'} className="mt-3 inline-block text-sm font-medium text-green-700 underline">
                    Unduh hasil unggahan
                  </a>
                </div>
              )}

              {uploadError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {uploadError}
                </div>
              )}

              <label className="block rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-700">Pilih file Scratch (.sb3)</span>
                <input
                  type="file"
                  accept=".sb3"
                  disabled={progressSaving}
                  className="mt-4 block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-blue-700"
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
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 mb-4">Periksa pekerjaanmu:</h4>
              {progressLoading ? (
                <p className="py-4 text-sm text-gray-500">Memuat progress...</p>
              ) : (
                <ul className="space-y-3">
                  {exercise.checklists.map((item) => {
                    const completed = completedChecklistIds.has(item.id)
                    return (
                      <li key={item.id} className={cn('flex items-start gap-3 p-3 rounded-lg', completed ? 'bg-green-50' : 'bg-gray-50')}>
                        <input
                          type="checkbox"
                          id={`check-${item.id}`}
                          checked={completed}
                          disabled={!userId || progressSaving}
                          onChange={(event) => toggleChecklist(item.id, event.target.checked)}
                          className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                        />
                        <label htmlFor={`check-${item.id}`} className={cn('cursor-pointer', completed ? 'text-green-800 line-through' : 'text-gray-700')}>
                          {item.description}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
              {exercise.checklists.length === 0 && (
                <p className="text-gray-500 text-center py-8">Belum ada checklist untuk latihan ini.</p>
              )}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Centang semua item di atas jika hasil pekerjaanmu sudah sesuai.
                  Jika ada yang belum, coba perbaiki kode Scratch-mu dan bandingkan lagi dengan video!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            Scratch Challenge - Platform pembelajaran coding untuk anak-anak
          </p>
        </div>
      </footer>
    </div>
  )
}