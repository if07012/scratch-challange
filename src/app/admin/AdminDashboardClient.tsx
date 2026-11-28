'use client'

import Link from 'next/link'
import { cn, captureVideoThumbnail } from '@/lib/utils'
import { LogoutButton } from '@/components/LogoutButton'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  LayoutDashboard,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Archive,
  Sparkles,
  ListChecks,
  Upload,
  Video,
  HardDrive,
  Wand2,
  Info,
  ArrowLeft,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Category, Exercise, ExerciseChecklist } from '@/lib/supabase/types'

function ChecklistEditor({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const items = value.split('\n').map((item) => item.trim()).filter(Boolean)
  const commit = (next: string[]) => onChange(next.join('\n'))

  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-500">Belum ada checklist. Tambahkan item pertama.</p>
      )}
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700">{index + 1}</span>
            <span className="flex-1 break-words text-sm text-neutral-800">{item}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => commit(items.filter((_, i) => i !== index))}
              className="rounded-lg p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
              aria-label={`Hapus item ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          type="text"
          className={inputClass}
          placeholder="Tambah item checklist..."
          disabled={disabled}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            const input = event.currentTarget
            const item = input.value.trim()
            if (!item) return
            commit([...items, item])
            input.value = ''
          }}
        />
      </div>
      <p className="text-xs text-neutral-500">Tekan Enter untuk menambah item. Checklist bisa lebih dari satu.</p>
    </div>
  )
}

function CategoryMultiSelect({ categories, value, onChange }: { categories: Category[]; value: string[]; onChange: (value: string[]) => void }) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id])
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {categories.map((category) => {
        const selected = value.includes(category.id)
        const index = value.indexOf(category.id)
        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(category.id)}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors',
              selected
                ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500/30'
                : 'border-neutral-300 bg-white text-neutral-700 hover:border-primary-300 hover:bg-neutral-50',
            )}
          >
            <span className={cn(
              'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold',
              selected ? 'border-primary-600 bg-primary-600 text-white' : 'border-neutral-300 text-transparent',
            )}>
              {selected ? index + 1 : '·'}
            </span>
            <span className="truncate">{category.name}</span>
          </button>
        )
      })}
    </div>
  )
}

function HtmlEditor({ name, value, onChange, placeholder }: { name: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const format = (command: string, commandValue?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  const addLink = () => {
    const url = window.prompt('Masukkan URL link')?.trim()
    if (url) format('createLink', url)
  }

  const toolbarButton = 'rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 transition-colors'

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-xl border border-neutral-300 border-b-neutral-200 bg-neutral-50 p-2">
        <button type="button" className={toolbarButton} onClick={() => format('bold')}><b>B</b></button>
        <button type="button" className={toolbarButton} onClick={() => format('italic')}><i>I</i></button>
        <button type="button" className={toolbarButton} onClick={() => format('underline')}><u>U</u></button>
        <button type="button" className={toolbarButton} onClick={() => format('formatBlock', 'h1')}>H1</button>
        <button type="button" className={toolbarButton} onClick={() => format('formatBlock', 'h2')}>H2</button>
        <button type="button" className={toolbarButton} onClick={() => format('formatBlock', 'h3')}>H3</button>
        <button type="button" className={toolbarButton} onClick={() => format('formatBlock', 'h4')}>H4</button>
        <button type="button" className={toolbarButton} onClick={() => format('formatBlock', 'h5')}>H5</button>
        <button type="button" className={toolbarButton} onClick={() => format('formatBlock', 'h6')}>H6</button>
        <button type="button" className={toolbarButton} onClick={() => format('formatBlock', 'p')}>P</button>
        <button type="button" className={toolbarButton} onClick={() => format('insertUnorderedList')}>• Daftar</button>
        <button type="button" className={toolbarButton} onClick={() => format('insertOrderedList')}>1. Daftar</button>
        <button type="button" className={toolbarButton} onClick={() => format('formatBlock', 'blockquote')}>Quote</button>
        <button type="button" className={toolbarButton} onClick={addLink}>Link</button>
        <button type="button" className={toolbarButton} onClick={() => format('removeFormat')}>Hapus format</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onBlur={(event) => onChange(event.currentTarget.innerHTML)}
        className="min-h-40 rounded-b-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none focus:ring-2 focus:ring-primary-500 [&:empty]:before:text-neutral-400 [&:empty]:before:content-[attr(data-placeholder)]"
      />
      <input type="hidden" name={name} value={value} />
    </div>
  )
}

const inputClass = 'w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 sm:py-2.5 text-base sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition'
const labelClass = 'block text-sm font-semibold text-neutral-700 mb-1.5'
const sectionClass = 'rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 space-y-5 shadow-sm'

function SectionHeading({ icon: Icon, title, hint }: { icon: React.ComponentType<{ className?: string }>; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        {hint && <p className="text-xs text-neutral-500">{hint}</p>}
      </div>
    </div>
  )
}

interface AdminDashboardClientProps {
  categories: Category[]
  exercises: Exercise[]
  googleResult?: string
  driveConfigured: boolean
}

export function AdminDashboardClient({ categories, exercises, googleResult, driveConfigured }: AdminDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [uploading, setUploading] = useState('')
  const googleTokenStatus = googleResult === 'missing_config'
    ? 'Tambahkan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di environment aplikasi.'
    : googleResult ? `Google consent gagal: ${googleResult}` : ''
  const [createChecklistText, setCreateChecklistText] = useState('')
  const [editingChecklistText, setEditingChecklistText] = useState('')
  const [editingChecklists, setEditingChecklists] = useState<ExerciseChecklist[]>([])
  const [createCaseDescription, setCreateCaseDescription] = useState('')
  const [editingCaseDescription, setEditingCaseDescription] = useState('')
  const [createCategoryIds, setCreateCategoryIds] = useState<string[]>([])
  const [editingCategoryIds, setEditingCategoryIds] = useState<string[]>([])
  const [aiFixing, setAiFixing] = useState(false)
  const [aiSuggestingChecklist, setAiSuggestingChecklist] = useState(false)

  useEffect(() => {
    if (googleResult) window.history.replaceState({}, '', '/admin')
  }, [googleResult])

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exercise.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || exercise.category_ids?.includes(filterCategory) || exercise.category_id === filterCategory
    const matchesDifficulty = filterDifficulty === 'all' || exercise.difficulty === filterDifficulty
    const matchesStatus = filterStatus === 'all' || exercise.status === filterStatus
    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus
  })

  const statusStyles = {
    published: 'bg-success-100 text-success-700 ring-1 ring-success-200',
    draft: 'bg-accent-100 text-accent-700 ring-1 ring-accent-200',
    archived: 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200',
  }

  const statusLabels = {
    published: 'Dipublikasikan',
    draft: 'Draft',
    archived: 'Arsip',
  }

  const difficultyLabels = {
    beginner: 'Pemula',
    intermediate: 'Menengah',
    advanced: 'Mahir',
  }

  const counts = {
    total: exercises.length,
    published: exercises.filter((item) => item.status === 'published').length,
    draft: exercises.filter((item) => item.status === 'draft').length,
    archived: exercises.filter((item) => item.status === 'archived').length,
  }

  const getCategoryNames = (exercise: Exercise) => {
    const ids = exercise.category_ids?.length ? exercise.category_ids : exercise.category_id ? [exercise.category_id] : []
    const names = ids.map((id) => categories.find((cat) => cat.id === id)?.name).filter(Boolean)
    return names.length ? names : ['Tanpa Kategori']
  }

  const handleCreate = async (formData: FormData) => {
    const data = Object.fromEntries(formData)

    const instructions = data.instructions ? String(data.instructions).split('\n').filter(Boolean) : []
    const learningObjectives = data.learning_objectives ? String(data.learning_objectives).split('\n').filter(Boolean) : []

    const payload = {
      category_id: createCategoryIds[0] || null,
      category_ids: createCategoryIds,
      title: data.title,
      slug: data.slug,
      short_description: data.description || null,
      case_description: data.case_description || null,
      problem_statement: data.problem_statement || null,
      instructions,
      learning_objectives: learningObjectives,
      difficulty: data.difficulty,
      estimated_minutes: parseInt(String(data.estimated_minutes || '30')) || 30,
      thumbnail_url: data.thumbnail_url || null,
      scratch_file_url: data.scratch_file_url || null,
      scratch_file_name: data.scratch_file_name || null,
      scratch_file_type: data.scratch_file_type || 'starter',
      video_url: data.video_url || null,
      video_type: data.video_type || 'youtube',
      status: 'draft',
      sort_order: 0,
    }

    const response = await fetch('/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      alert('Gagal membuat latihan: ' + error.error)
      return
    }

    const created = await response.json() as { exercise: Exercise }
    const checklistItems = createChecklistText.split('\n').map((item) => item.trim()).filter(Boolean)
    for (const [index, description] of checklistItems.entries()) {
      await fetch(`/api/exercises/${created.exercise.id}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, sort_order: index }),
      })
    }

    alert('Latihan berhasil dibuat!')
    window.location.reload()
  }

  const handleUpdate = async (formData: FormData) => {
    const data = Object.fromEntries(formData)
    const id = data.id as string

    const instructions = data.instructions ? String(data.instructions).split('\n').filter(Boolean) : []
    const learningObjectives = data.learning_objectives ? String(data.learning_objectives).split('\n').filter(Boolean) : []

    const payload = {
      category_id: editingCategoryIds[0] || null,
      category_ids: editingCategoryIds,
      title: data.title,
      slug: data.slug,
      short_description: data.description || null,
      case_description: data.case_description || null,
      problem_statement: data.problem_statement || null,
      instructions,
      learning_objectives: learningObjectives,
      difficulty: data.difficulty,
      estimated_minutes: parseInt(String(data.estimated_minutes || '30')) || 30,
      thumbnail_url: data.thumbnail_url || null,
      scratch_file_url: data.scratch_file_url || null,
      scratch_file_name: data.scratch_file_name || null,
      scratch_file_type: data.scratch_file_type || 'starter',
      video_url: data.video_url || null,
      video_type: data.video_type || 'youtube',
      status: data.status,
      sort_order: parseInt(String(data.sort_order || '0')) || 0,
    }

    const response = await fetch('/api/exercises/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      alert('Gagal memperbarui latihan: ' + error.error)
      return
    }

    // Reconcile in order so existing checklist IDs (and student progress) survive.
    const checklistItems = editingChecklistText.split('\n').map((item) => item.trim()).filter(Boolean)
    const rows = Math.max(editingChecklists.length, checklistItems.length)
    for (let i = 0; i < rows; i++) {
      const existing = editingChecklists[i]
      const description = checklistItems[i]
      if (existing && description) {
        if (existing.description !== description || existing.sort_order !== i) {
          await fetch(`/api/checklists/${existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, sort_order: i }),
          })
        }
      } else if (existing) {
        await fetch(`/api/checklists/${existing.id}`, { method: 'DELETE' })
      } else if (description) {
        await fetch(`/api/exercises/${id}/checklists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, sort_order: i }),
        })
      }
    }

    alert('Latihan berhasil diperbarui!')
    window.location.reload()
  }

  const fixDescriptionWithAI = async (description: string, title: string, setDescription: (value: string) => void) => {
    if (!description.trim()) {
      alert('Isi Deskripsi Kasus terlebih dahulu sebelum menggunakan AI.')
      return
    }

    setAiFixing(true)
    try {
      const response = await fetch('/api/ai/fix-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, title }),
      })
      const result = await response.json() as { description?: string; error?: string }
      if (!response.ok) throw new Error(result.error || 'GroqAI gagal memperbaiki deskripsi')
      if (result.description) setDescription(result.description)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'GroqAI gagal memperbaiki deskripsi')
    } finally {
      setAiFixing(false)
    }
  }

  const suggestChecklistWithAI = async (
    problemStatement: string,
    title: string,
    currentChecklist: string,
    setChecklist: (value: string) => void,
  ) => {
    if (!problemStatement.trim()) {
      alert('Isi Pernyataan Masalah terlebih dahulu sebelum meminta saran checklist.')
      return
    }

    setAiSuggestingChecklist(true)
    try {
      const response = await fetch('/api/ai/fix-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest-checklist', problem_statement: problemStatement, title }),
      })
      const result = await response.json() as { items?: string[]; error?: string }
      if (!response.ok) throw new Error(result.error || 'GroqAI gagal menyarankan checklist')
      if (!result.items?.length) throw new Error('GroqAI tidak mengembalikan saran checklist')

      const existing = new Set(currentChecklist.split('\n').map((item) => item.trim()).filter(Boolean))
      const additions = result.items.filter((item) => !existing.has(item.trim()))
      const combined = [
        ...currentChecklist.split('\n').map((item) => item.trim()).filter(Boolean),
        ...additions,
      ]
      setChecklist(combined.join('\n'))
    } catch (error) {
      alert(error instanceof Error ? error.message : 'GroqAI gagal menyarankan checklist')
    } finally {
      setAiSuggestingChecklist(false)
    }
  }

  const openEditExercise = async (exercise: Exercise) => {
    setEditingExercise(exercise)
    setEditingCaseDescription(exercise.case_description || '')
    setEditingCategoryIds(exercise.category_ids?.length ? exercise.category_ids : exercise.category_id ? [exercise.category_id] : [])
    try {
      const response = await fetch(`/api/exercises/${exercise.id}`)
      const result = await response.json() as { exercise?: Exercise & { checklists?: ExerciseChecklist[] } }
      const checklists = result.exercise?.checklists || []
      setEditingChecklists(checklists)
      setEditingChecklistText(checklists.map((item) => item.description).join('\n'))
      if (result.exercise?.category_ids) setEditingCategoryIds(result.exercise.category_ids)
    } catch {
      setEditingChecklists([])
      setEditingChecklistText('')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus latihan ini?')) return

    const response = await fetch('/api/exercises/' + id, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      alert('Gagal menghapus latihan: ' + error.error)
      return
    }

    alert('Latihan berhasil dihapus!')
    window.location.reload()
  }

  const uploadMedia = async (file: File | undefined, kind: 'image' | 'video' | 'scratch', fieldName: string, form: HTMLFormElement | null) => {
    if (!file || !form) return
    setUploading(fieldName)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('kind', kind)
      const response = await fetch('/api/upload', { method: 'POST', body })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Upload gagal')
      const field = form.elements.namedItem(fieldName)
      if (field instanceof HTMLInputElement) field.value = result.url

      if (kind === 'scratch') {
        const nameField = form.elements.namedItem('scratch_file_name')
        if (nameField instanceof HTMLInputElement && !nameField.value) nameField.value = file.name
      }

      if (kind === 'video') {
        const thumbnailField = form.elements.namedItem('thumbnail_url')
        // Drive returns its own thumbnail; Supabase fallback returns none, so grab a frame in the browser.
        let thumbnailUrl: string | null = typeof result.thumbnailUrl === 'string' ? result.thumbnailUrl : null
        if (!thumbnailUrl && thumbnailField instanceof HTMLInputElement) {
          const frame = await captureVideoThumbnail(file)
          if (frame) {
            const thumbBody = new FormData()
            thumbBody.append('file', frame)
            thumbBody.append('kind', 'image')
            const thumbResponse = await fetch('/api/upload', { method: 'POST', body: thumbBody })
            const thumbResult = await thumbResponse.json() as { url?: string }
            if (thumbResponse.ok && thumbResult.url) thumbnailUrl = thumbResult.url
          }
        }
        if (thumbnailUrl && thumbnailField instanceof HTMLInputElement) thumbnailField.value = thumbnailUrl
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload gagal')
    } finally {
      setUploading('')
    }
  }

  const renderCreateForm = () => (
    <form id="create-exercise-form" onSubmit={(e) => { e.preventDefault(); handleCreate(new FormData(e.currentTarget)) }} className="space-y-5">
      <div className={sectionClass}>
        <SectionHeading icon={FileText} title="Informasi Dasar" hint="Judul dan ringkasan latihan" />
        <div>
          <label className={labelClass}>Judul *</label>
          <input name="title" type="text" className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Slug *</label>
          <input name="slug" type="text" className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Deskripsi Singkat</label>
          <textarea name="description" rows={3} className={inputClass} />
        </div>
      </div>

      <div className={sectionClass}>
        <SectionHeading icon={ListChecks} title="Konten Latihan" hint="Deskripsi kasus, masalah, instruksi, dan tujuan" />
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className={labelClass + ' mb-0'}>Deskripsi Kasus (HTML)</label>
            <button
              type="button"
              disabled={aiFixing}
              onClick={(event) => {
                const form = event.currentTarget.closest('form')
                const titleInput = form?.elements.namedItem('title')
                const title = titleInput instanceof HTMLInputElement ? titleInput.value : ''
                void fixDescriptionWithAI(createCaseDescription, title, setCreateCaseDescription)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {aiFixing ? 'Memperbaiki...' : 'AI Perbaiki Deskripsi'}
            </button>
          </div>
          <HtmlEditor name="case_description" value={createCaseDescription} onChange={setCreateCaseDescription} placeholder="Tulis deskripsi kasus lengkap..." />
        </div>
        <div>
          <label className={labelClass}>Pernyataan Masalah</label>
          <textarea name="problem_statement" rows={4} className={inputClass} placeholder="Pernyataan masalah yang harus diselesaikan..." />
        </div>
        <div>
          <label className={labelClass}>Instruksi (satu per baris)</label>
          <textarea name="instructions" rows={4} className={inputClass} placeholder="Instruksi 1
Instruksi 2
Instruksi 3" />
        </div>
        <div>
          <label className={labelClass}>Tujuan Pembelajaran (satu per baris)</label>
          <textarea name="learning_objectives" rows={4} className={inputClass} placeholder="Tujuan 1
Tujuan 2
Tujuan 3" />
        </div>
      </div>

      <div className={sectionClass}>
        <SectionHeading icon={Sparkles} title="Klasifikasi" hint="Pilih satu atau lebih kategori, tingkat, dan estimasi waktu" />
        <div>
          <label className={labelClass}>Kategori * <span className="font-normal text-neutral-500">(bisa lebih dari satu)</span></label>
          <CategoryMultiSelect categories={categories} value={createCategoryIds} onChange={setCreateCategoryIds} />
          {createCategoryIds.length > 1 && <p className="mt-1.5 text-xs text-neutral-500">Kategori pertama menjadi kategori utama latihan.</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tingkat Kesulitan *</label>
            <select name="difficulty" className={inputClass} required>
              <option value="beginner">Pemula</option>
              <option value="intermediate">Menengah</option>
              <option value="advanced">Lanjutan</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Estimasi Waktu (menit)</label>
            <input name="estimated_minutes" type="number" className={inputClass} />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <SectionHeading icon={Upload} title="Media & File" hint="Thumbnail, project Scratch, dan video hasil" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Thumbnail URL</label>
            <input name="thumbnail_url" type="text" className={inputClass} placeholder="Thumbnail otomatis akan diisi saat video diunggah" />
          </div>
          <div>
            <label className={labelClass}>File Scratch URL / Upload .sb3</label>
            <input name="scratch_file_url" type="text" className={inputClass} placeholder="https://... atau unggah file .sb3" />
            <input type="file" accept=".sb3,application/octet-stream" onChange={(event) => uploadMedia(event.target.files?.[0], 'scratch', 'scratch_file_url', event.target.form)} className="mt-2 block w-full text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary-700" />
            {uploading === 'scratch_file_url' && <p className="mt-1 text-xs text-primary-600">Mengunggah file Scratch...</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Nama File Scratch</label>
            <input name="scratch_file_name" type="text" className={inputClass} placeholder="file.sb3" />
          </div>
          <div>
            <label className={labelClass}>Tipe File Scratch</label>
            <select name="scratch_file_type" className={inputClass}>
              <option value="starter">Starter</option>
              <option value="partial">Partial</option>
              <option value="blank">Blank</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Sort Order</label>
            <input name="sort_order" type="number" className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Video URL / Upload Video</label>
            <input name="video_url" type="text" className={inputClass} placeholder="https://... atau unggah MP4/WebM" />
            <input type="file" accept="video/mp4,video/webm,video/ogg" onChange={(event) => uploadMedia(event.target.files?.[0], 'video', 'video_url', event.target.form)} className="mt-2 block w-full text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary-700" />
            {uploading === 'video_url' && <p className="mt-1 text-xs text-primary-600">Mengunggah video...</p>}
          </div>
          <div>
            <label className={labelClass}>Tipe Video</label>
            <select name="video_type" className={inputClass}>
              <option value="youtube">YouTube Embed</option>
              <option value="external">External (file upload)</option>
            </select>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between gap-2">
          <SectionHeading icon={CheckCircle2} title="Checklist Tugas" hint="Bisa lebih dari satu item" />
          <button
            type="button"
            disabled={aiSuggestingChecklist}
            onClick={(event) => {
              const form = event.currentTarget.closest('form')
              const titleInput = form?.elements.namedItem('title')
              const problemInput = form?.elements.namedItem('problem_statement')
              const title = titleInput instanceof HTMLInputElement ? titleInput.value : ''
              const problemStatement = problemInput instanceof HTMLTextAreaElement ? problemInput.value : ''
              void suggestChecklistWithAI(problemStatement, title, createChecklistText, setCreateChecklistText)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-success-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" />
            {aiSuggestingChecklist ? 'Menyusun...' : 'AI Sarankan Checklist'}
          </button>
        </div>
        <ChecklistEditor value={createChecklistText} onChange={setCreateChecklistText} disabled={aiSuggestingChecklist} />
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t border-neutral-200 bg-white/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
        <button
          type="button"
          onClick={() => setShowCreateModal(false)}
          className="rounded-xl bg-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors sm:py-2.5"
        >
          Batal
        </button>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm sm:py-2.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          Simpan Latihan
        </button>
      </div>
    </form>
  )

  const renderEditForm = () => {
    if (!editingExercise) return null
    return (
      <form onSubmit={(event) => { event.preventDefault(); handleUpdate(new FormData(event.currentTarget)) }} className="space-y-5">
        <input type="hidden" name="id" value={editingExercise.id} />

        <div className={sectionClass}>
          <SectionHeading icon={FileText} title="Informasi Dasar" hint="Judul dan ringkasan latihan" />
          <div>
            <label className={labelClass}>Judul</label>
            <input name="title" defaultValue={editingExercise.title} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input name="slug" defaultValue={editingExercise.slug} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Deskripsi Singkat</label>
            <textarea name="description" rows={3} defaultValue={editingExercise.short_description || ''} className={inputClass} />
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeading icon={ListChecks} title="Konten Latihan" hint="Deskripsi kasus dan pernyataan masalah" />
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className={labelClass + ' mb-0'}>Deskripsi Kasus (HTML)</label>
              <button
                type="button"
                disabled={aiFixing}
                onClick={() => void fixDescriptionWithAI(editingCaseDescription, editingExercise.title, setEditingCaseDescription)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />
                {aiFixing ? 'Memperbaiki...' : 'AI Perbaiki Deskripsi'}
              </button>
            </div>
            <HtmlEditor key={editingExercise.id} name="case_description" value={editingCaseDescription} onChange={setEditingCaseDescription} placeholder="Tulis deskripsi kasus lengkap..." />
          </div>
          <div>
            <label className={labelClass}>Pernyataan Masalah</label>
            <textarea name="problem_statement" rows={4} defaultValue={editingExercise.problem_statement || ''} className={inputClass} />
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeading icon={Sparkles} title="Klasifikasi & Status" hint="Kategori, tingkat, status, dan urutan" />
          <div>
            <label className={labelClass}>Kategori <span className="font-normal text-neutral-500">(bisa lebih dari satu)</span></label>
            <CategoryMultiSelect categories={categories} value={editingCategoryIds} onChange={setEditingCategoryIds} />
            {editingCategoryIds.length > 1 && <p className="mt-1.5 text-xs text-neutral-500">Kategori pertama menjadi kategori utama latihan.</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Tingkat Kesulitan</label>
              <select name="difficulty" defaultValue={editingExercise.difficulty} className={inputClass}>
                <option value="beginner">Pemula</option><option value="intermediate">Menengah</option><option value="advanced">Lanjutan</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select name="status" defaultValue={editingExercise.status} className={inputClass}>
                <option value="draft">Draft</option><option value="published">Dipublikasikan</option><option value="archived">Arsip</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Estimasi Menit</label>
              <input name="estimated_minutes" type="number" defaultValue={editingExercise.estimated_minutes} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Sort Order</label>
              <input name="sort_order" type="number" defaultValue={editingExercise.sort_order} className={inputClass} />
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeading icon={Video} title="Media & File" hint="Video, thumbnail, dan project Scratch" />
          <div>
            <label className={labelClass}>Video URL / Upload Video</label>
            <input name="video_url" defaultValue={editingExercise.video_url || ''} className={inputClass} />
            <input type="file" accept="video/mp4,video/webm,video/ogg" onChange={(event) => uploadMedia(event.target.files?.[0], 'video', 'video_url', event.target.form)} className="mt-2 block w-full text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary-700" />
            {uploading === 'video_url' && <p className="mt-1 text-xs text-primary-600">Mengunggah video...</p>}
          </div>
          <input type="hidden" name="video_type" value={editingExercise.video_type} />
          <div>
            <label className={labelClass}>Thumbnail URL</label>
            <input name="thumbnail_url" defaultValue={editingExercise.thumbnail_url || ''} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>File Scratch URL / Upload .sb3</label>
              <input name="scratch_file_url" defaultValue={editingExercise.scratch_file_url || ''} className={inputClass} />
              <input type="file" accept=".sb3,application/octet-stream" onChange={(event) => uploadMedia(event.target.files?.[0], 'scratch', 'scratch_file_url', event.target.form)} className="mt-2 block w-full text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary-700" />
              {uploading === 'scratch_file_url' && <p className="mt-1 text-xs text-primary-600">Mengunggah file Scratch...</p>}
            </div>
            <div>
              <label className={labelClass}>Nama File Scratch</label>
              <input name="scratch_file_name" defaultValue={editingExercise.scratch_file_name || ''} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Tipe File Scratch</label>
            <select name="scratch_file_type" defaultValue={editingExercise.scratch_file_type} className={inputClass}>
              <option value="starter">Starter</option><option value="partial">Partial</option><option value="blank">Blank</option>
            </select>
          </div>
        </div>

        <div className={sectionClass}>
          <div className="flex items-center justify-between gap-2">
            <SectionHeading icon={CheckCircle2} title="Checklist Tugas" hint="Bisa lebih dari satu item" />
            <button
              type="button"
              disabled={aiSuggestingChecklist}
              onClick={(event) => {
                const form = event.currentTarget.closest('form')
                const problemInput = form?.elements.namedItem('problem_statement')
                const problemStatement = problemInput instanceof HTMLTextAreaElement
                  ? problemInput.value
                  : editingExercise.problem_statement || ''
                void suggestChecklistWithAI(
                  problemStatement,
                  editingExercise.title,
                  editingChecklistText,
                  setEditingChecklistText,
                )
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-success-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {aiSuggestingChecklist ? 'Menyusun...' : 'AI Sarankan Checklist'}
            </button>
          </div>
          <textarea value={editingChecklistText} onChange={(event) => setEditingChecklistText(event.target.value)} rows={5} className={inputClass} placeholder="Satu item per baris" />
          <ChecklistEditor value={editingChecklistText} onChange={setEditingChecklistText} disabled={aiSuggestingChecklist} />
        </div>

        <input type="hidden" name="instructions" value={editingExercise.instructions.join('\n')} />
        <input type="hidden" name="learning_objectives" value={editingExercise.learning_objectives.join('\n')} />
        <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t border-neutral-200 bg-white/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={() => setEditingExercise(null)} className="rounded-xl bg-neutral-100 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors sm:py-2.5">Batal</button>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm sm:py-2.5">
            <CheckCircle2 className="w-4 h-4" />
            Simpan Perubahan
          </button>
        </div>
      </form>
    )
  }

  const statCards = [
    { label: 'Total Latihan', value: counts.total, icon: FileText, color: 'bg-primary-100 text-primary-600' },
    { label: 'Dipublikasikan', value: counts.published, icon: CheckCircle2, color: 'bg-success-100 text-success-600' },
    { label: 'Draft', value: counts.draft, icon: Clock, color: 'bg-accent-100 text-accent-600' },
    { label: 'Arsip', value: counts.archived, icon: Archive, color: 'bg-neutral-100 text-neutral-600' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-900 leading-tight">Admin Latihan</h1>
              <p className="text-xs text-neutral-500">Scratch Challenge</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/admin/submissions" className="hidden sm:flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-50 transition-colors">
              <Upload className="h-4 w-4" /> Hasil Siswa
            </Link>
            <Link href="/admin/users" className="hidden sm:flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-50 transition-colors">
              <Users className="h-4 w-4" /> Kelola User
            </Link>
            <LogoutButton className="hidden sm:inline-block text-sm font-medium text-neutral-600 hover:text-neutral-900" />
            <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm">
              <Plus className="h-4 w-4" /> Tambah Latihan
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex items-center gap-4">
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{value}</p>
                <p className="text-sm text-neutral-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Drive */}
        <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-100 text-secondary-600 flex items-center justify-center shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-neutral-900">Penyimpanan Google Drive</h2>
                <p className="text-sm text-neutral-600 max-w-2xl">Semua upload disimpan oleh akun penyimpanan aplikasi. Siapa pun yang login dapat mengunggah. Jika Drive gagal, file otomatis disimpan ke Supabase Storage.</p>
              </div>
            </div>
            {driveConfigured
              ? <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-700 ring-1 ring-success-200"><CheckCircle2 className="w-3.5 h-3.5" />Terhubung</span>
              : <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-700 ring-1 ring-accent-200"><Info className="w-3.5 h-3.5" />Cadangan Supabase Storage</span>}
          </div>
          {(googleTokenStatus || !driveConfigured) && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-neutral-50 p-3 border border-neutral-200">
              {!driveConfigured && (
                <a href="/api/google-drive/token?oauth=start" className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors">
                  Hubungkan akun penyimpanan
                </a>
              )}
              {!driveConfigured && <p className="text-sm text-neutral-700">Upload tetap berjalan dan disimpan ke bucket Supabase <code className="rounded bg-neutral-200 px-1.5 py-0.5 text-xs">uploads</code> sampai Drive terhubung.</p>}
              {googleTokenStatus && <p className="text-sm text-neutral-700">{googleTokenStatus}</p>}
            </div>
          )}
        </section>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari latihan..." className={inputClass + ' pl-10'} />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
            <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className={inputClass}><option value="all">Semua Kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
            <select value={filterDifficulty} onChange={(event) => setFilterDifficulty(event.target.value)} className={inputClass}><option value="all">Semua Tingkat</option><option value="beginner">Pemula</option><option value="intermediate">Menengah</option><option value="advanced">Lanjutan</option></select>
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className={inputClass}><option value="all">Semua Status</option><option value="draft">Draft</option><option value="published">Dipublikasikan</option><option value="archived">Arsip</option></select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Latihan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Tingkat</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredExercises.map((exercise) => (
                  <tr key={exercise.id} className="text-neutral-700 hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-neutral-900">{exercise.title}</div>
                      <div className="text-sm text-neutral-500">/{exercise.slug}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {getCategoryNames(exercise).map((name) => (
                          <span key={name} className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 ring-1 ring-primary-200">{name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200">{difficultyLabels[exercise.difficulty]}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', statusStyles[exercise.status])}>{statusLabels[exercise.status]}</span>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <button onClick={() => openEditExercise(exercise)} className="mr-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors">
                        <Edit className="h-4 w-4" /> Edit
                      </button>
                      <button onClick={() => handleDelete(exercise.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" /> Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredExercises.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                      Tidak ada latihan yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-50 animate-fade-in">
          <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
              <button type="button" onClick={() => setShowCreateModal(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors" aria-label="Kembali">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-neutral-900">Tambah Latihan</h2>
                <p className="truncate text-xs text-neutral-500">Lengkapi detail latihan baru</p>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
            {renderCreateForm()}
          </div>
        </div>
      )}
      {editingExercise && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-50 animate-fade-in">
          <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
              <button type="button" onClick={() => setEditingExercise(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors" aria-label="Kembali">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-neutral-900">Edit Latihan</h2>
                <p className="truncate text-xs text-neutral-500">{editingExercise.title}</p>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
            {renderEditForm()}
          </div>
        </div>
      )}
    </div>
  )
}
