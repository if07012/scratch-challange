'use client'

import { cn } from '@/lib/utils'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  LayoutDashboard
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Category, Exercise, ExerciseChecklist } from '@/lib/supabase/types'

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

  const toolbarButton = 'rounded border border-gray-300 bg-white px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100'

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-gray-300 bg-gray-50 p-2">
        <button type="button" className={toolbarButton} onClick={() => format('bold')}><b>B</b></button>
        <button type="button" className={toolbarButton} onClick={() => format('italic')}><i>I</i></button>
        <button type="button" className={toolbarButton} onClick={() => format('underline')}><u>U</u></button>
        <button type="button" className={toolbarButton} onClick={() => format('formatBlock', 'h2')}>H2</button>
        <button type="button" className={toolbarButton} onClick={() => format('formatBlock', 'h3')}>H3</button>
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
        className="min-h-40 rounded-b-lg border border-t-0 border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 [&:empty]:before:text-gray-400 [&:empty]:before:content-[attr(data-placeholder)]"
      />
      <input type="hidden" name={name} value={value} />
    </div>
  )
}

interface AdminDashboardClientProps {
  categories: Category[]
  exercises: Exercise[]
}

export function AdminDashboardClient({ categories, exercises }: AdminDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [uploading, setUploading] = useState('')
  const [googleClientId, setGoogleClientId] = useState('')
  const [googleClientSecret, setGoogleClientSecret] = useState('')
  const [googleRefreshToken, setGoogleRefreshToken] = useState('')
  const [googleAccessToken, setGoogleAccessToken] = useState('')
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleTokenStatus, setGoogleTokenStatus] = useState('')
  const [gettingGoogleToken, setGettingGoogleToken] = useState(false)
  const [createChecklistText, setCreateChecklistText] = useState('')
  const [editingChecklistText, setEditingChecklistText] = useState('')
  const [editingChecklists, setEditingChecklists] = useState<ExerciseChecklist[]>([])
  const [createCaseDescription, setCreateCaseDescription] = useState('')
  const [editingCaseDescription, setEditingCaseDescription] = useState('')
  const [aiFixing, setAiFixing] = useState(false)

  useEffect(() => {
    const googleResult = new URLSearchParams(window.location.search).get('google')
    if (googleResult === 'connected') {
      setGoogleConnected(true)
      setGoogleTokenStatus('Google Drive berhasil terhubung.')
      window.history.replaceState({}, '', '/admin')
    } else if (googleResult === 'missing_config') {
      setGoogleTokenStatus('Tambahkan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di environment aplikasi.')
      window.history.replaceState({}, '', '/admin')
    } else if (googleResult) {
      setGoogleTokenStatus(`Google consent gagal: ${googleResult}`)
      window.history.replaceState({}, '', '/admin')
    } else {
      fetch('/api/google-drive/token')
        .then((response) => response.json())
        .then((status) => {
          if (status.connected) {
            setGoogleConnected(true)
            setGoogleTokenStatus('Google Drive terhubung.')
          }
        })
        .catch(() => undefined)
    }
  }, [])

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exercise.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || exercise.category_id === filterCategory
    const matchesDifficulty = filterDifficulty === 'all' || exercise.difficulty === filterDifficulty
    const matchesStatus = filterStatus === 'all' || exercise.status === filterStatus
    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus
  })

  const statusStyles = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    archived: 'bg-gray-100 text-gray-700',
  }

  const statusLabels = {
    published: 'Dipublikasikan',
    draft: 'Draft',
    archived: 'Arsip',
  }

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Tanpa Kategori'
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || categoryId
  }

  const handleCreate = async (formData: FormData) => {
    const data = Object.fromEntries(formData)
    
    const instructions = data.instructions ? String(data.instructions).split('\n').filter(Boolean) : []
    const learningObjectives = data.learning_objectives ? String(data.learning_objectives).split('\n').filter(Boolean) : []

    const payload = {
      category_id: data.category_id || null,
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
      category_id: data.category_id || null,
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

    for (const item of editingChecklists) {
      await fetch(`/api/checklists/${item.id}`, { method: 'DELETE' })
    }
    const checklistItems = editingChecklistText.split('\n').map((item) => item.trim()).filter(Boolean)
    for (const [index, description] of checklistItems.entries()) {
      await fetch(`/api/exercises/${id}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, sort_order: index }),
      })
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

  const openEditExercise = async (exercise: Exercise) => {
    setEditingExercise(exercise)
    setEditingCaseDescription(exercise.case_description || '')
    try {
      const response = await fetch(`/api/exercises/${exercise.id}`)
      const result = await response.json() as { exercise?: Exercise & { checklists?: ExerciseChecklist[] } }
      const checklists = result.exercise?.checklists || []
      setEditingChecklists(checklists)
      setEditingChecklistText(checklists.map((item) => item.description).join('\n'))
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

  const getGoogleAccessToken = async () => {
    if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
      setGoogleTokenStatus('Lengkapi Client ID, Client Secret, dan Refresh Token.')
      return
    }
    setGettingGoogleToken(true)
    setGoogleTokenStatus('')
    try {
      const response = await fetch('/api/google-drive/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          refreshToken: googleRefreshToken,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Gagal mengambil Google Access Token')
      setGoogleAccessToken(result.accessToken)
      setGoogleTokenStatus(`Access Token aktif selama ${result.expiresIn} detik.`)
    } catch (error) {
      setGoogleTokenStatus(error instanceof Error ? error.message : 'Gagal mengambil Google Access Token')
    } finally {
      setGettingGoogleToken(false)
    }
  }

  const uploadMedia = async (file: File | undefined, kind: 'image' | 'video' | 'scratch', fieldName: string, form: HTMLFormElement | null) => {
    if (!file || !form) return
    setUploading(fieldName)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('kind', kind)
      if (googleAccessToken && googleAccessToken !== 'connected') body.append('google_access_token', googleAccessToken)
      const response = await fetch('/api/upload', { method: 'POST', body })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Upload gagal')
      const field = form.elements.namedItem(fieldName)
      if (field instanceof HTMLInputElement) field.value = result.url

      if (kind === 'scratch') {
        const nameField = form.elements.namedItem('scratch_file_name')
        if (nameField instanceof HTMLInputElement && !nameField.value) nameField.value = file.name
      }

      if (kind === 'video' && typeof result.thumbnailUrl === 'string') {
        const thumbnailField = form.elements.namedItem('thumbnail_url')
        if (thumbnailField instanceof HTMLInputElement) thumbnailField.value = result.thumbnailUrl
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload gagal')
    } finally {
      setUploading('')
    }
  }

  const renderCreateForm = () => (
    <form id="create-exercise-form" onSubmit={(e) => { e.preventDefault(); handleCreate(new FormData(e.currentTarget)) }} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Judul *</label>
        <input name="title" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
        <input name="slug" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat</label>
        <textarea name="description" rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label className="block text-sm font-medium text-gray-700">Deskripsi Kasus (HTML)</label>
          <button
            type="button"
            disabled={aiFixing}
            onClick={(event) => {
              const form = event.currentTarget.closest('form')
              const titleInput = form?.elements.namedItem('title')
              const title = titleInput instanceof HTMLInputElement ? titleInput.value : ''
              void fixDescriptionWithAI(createCaseDescription, title, setCreateCaseDescription)
            }}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {aiFixing ? 'Memperbaiki...' : 'AI Perbaiki Deskripsi'}
          </button>
        </div>
        <HtmlEditor name="case_description" value={createCaseDescription} onChange={setCreateCaseDescription} placeholder="Tulis deskripsi kasus lengkap..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pernyataan Masalah</label>
        <textarea name="problem_statement" rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Pernyataan masalah yang harus diselesaikan..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instruksi (satu per baris)</label>
        <textarea name="instructions" rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Instruksi 1
Instruksi 2
Instruksi 3" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Pembelajaran (satu per baris)</label>
        <textarea name="learning_objectives" rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Tujuan 1
Tujuan 2
Tujuan 3" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
          <select name="category_id" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" required>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat Kesulitan *</label>
          <select name="difficulty" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" required>
            <option value="beginner">Pemula</option>
            <option value="intermediate">Menengah</option>
            <option value="advanced">Lanjutan</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimasi Waktu (menit)</label>
          <input name="estimated_minutes" type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
          <input name="thumbnail_url" type="url" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Thumbnail otomatis akan diisi saat video diunggah" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File Scratch URL / Upload .sb3</label>
          <input name="scratch_file_url" type="url" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://... atau unggah file .sb3" />
          <input type="file" accept=".sb3,application/octet-stream" onChange={(event) => uploadMedia(event.target.files?.[0], 'scratch', 'scratch_file_url', event.target.form)} className="mt-2 block w-full text-sm text-gray-700" />
          {uploading === 'scratch_file_url' && <p className="mt-1 text-xs text-blue-600">Mengunggah file Scratch...</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama File Scratch</label>
          <input name="scratch_file_name" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="file.sb3" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipe File Scratch</label>
          <select name="scratch_file_type" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
            <option value="starter">Starter</option>
            <option value="partial">Partial</option>
            <option value="blank">Blank</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
          <input name="sort_order" type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Video URL / Upload Video</label>
          <input name="video_url" type="url" className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://... atau unggah MP4/WebM" />
          <input type="file" accept="video/mp4,video/webm,video/ogg" onChange={(event) => uploadMedia(event.target.files?.[0], 'video', 'video_url', event.target.form)} className="mt-2 block w-full text-sm text-gray-700" />
          {uploading === 'video_url' && <p className="mt-1 text-xs text-blue-600">Mengunggah video...</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Video</label>
          <select name="video_type" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
            <option value="youtube">YouTube Embed</option>
            <option value="external">External (file upload)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Checklist Tugas</label>
        <textarea value={createChecklistText} onChange={(event) => setCreateChecklistText(event.target.value)} rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500" placeholder="Satu item per baris, contoh: Tambahkan sprite kucing" />
        <p className="mt-1 text-xs text-gray-500">Setiap baris akan menjadi satu item checklist.</p>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setShowCreateModal(false)}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
          <input name="title" defaultValue={editingExercise.title} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input name="slug" defaultValue={editingExercise.slug} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat</label>
          <textarea name="description" rows={3} defaultValue={editingExercise.short_description || ''} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500" />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="block text-sm font-medium text-gray-700">Deskripsi Kasus (HTML)</label>
            <button
              type="button"
              disabled={aiFixing}
              onClick={() => void fixDescriptionWithAI(editingCaseDescription, editingExercise.title, setEditingCaseDescription)}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {aiFixing ? 'Memperbaiki...' : 'AI Perbaiki Deskripsi'}
            </button>
          </div>
          <HtmlEditor key={editingExercise.id} name="case_description" value={editingCaseDescription} onChange={setEditingCaseDescription} placeholder="Tulis deskripsi kasus lengkap..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pernyataan Masalah</label>
          <textarea name="problem_statement" rows={4} defaultValue={editingExercise.problem_statement || ''} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tingkat Kesulitan</label>
            <select name="difficulty" defaultValue={editingExercise.difficulty} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900">
              <option value="beginner">Pemula</option><option value="intermediate">Menengah</option><option value="advanced">Lanjutan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" defaultValue={editingExercise.status} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900">
              <option value="draft">Draft</option><option value="published">Dipublikasikan</option><option value="archived">Arsip</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimasi Menit</label>
            <input name="estimated_minutes" type="number" defaultValue={editingExercise.estimated_minutes} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input name="sort_order" type="number" defaultValue={editingExercise.sort_order} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Video URL / Upload Video</label>
          <input name="video_url" defaultValue={editingExercise.video_url || ''} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900" />
          <input type="file" accept="video/mp4,video/webm,video/ogg" onChange={(event) => uploadMedia(event.target.files?.[0], 'video', 'video_url', event.target.form)} className="mt-2 block w-full text-sm text-gray-700" />
          {uploading === 'video_url' && <p className="mt-1 text-xs text-blue-600">Mengunggah video...</p>}
        </div>
        <input type="hidden" name="video_type" value={editingExercise.video_type} />
        <input type="hidden" name="category_id" value={editingExercise.category_id || ''} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
          <input name="thumbnail_url" defaultValue={editingExercise.thumbnail_url || ''} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File Scratch URL / Upload .sb3</label>
            <input name="scratch_file_url" defaultValue={editingExercise.scratch_file_url || ''} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900" />
            <input type="file" accept=".sb3,application/octet-stream" onChange={(event) => uploadMedia(event.target.files?.[0], 'scratch', 'scratch_file_url', event.target.form)} className="mt-2 block w-full text-sm text-gray-700" />
            {uploading === 'scratch_file_url' && <p className="mt-1 text-xs text-blue-600">Mengunggah file Scratch...</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama File Scratch</label>
            <input name="scratch_file_name" defaultValue={editingExercise.scratch_file_name || ''} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipe File Scratch</label>
          <select name="scratch_file_type" defaultValue={editingExercise.scratch_file_type} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900">
            <option value="starter">Starter</option><option value="partial">Partial</option><option value="blank">Blank</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Checklist Tugas</label>
          <textarea value={editingChecklistText} onChange={(event) => setEditingChecklistText(event.target.value)} rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500" placeholder="Satu item per baris" />
          <p className="mt-1 text-xs text-gray-500">Setiap baris akan menjadi satu item checklist.</p>
        </div>
        <input type="hidden" name="instructions" value={editingExercise.instructions.join('\n')} />
        <input type="hidden" name="learning_objectives" value={editingExercise.learning_objectives.join('\n')} />
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button type="button" onClick={() => setEditingExercise(null)} className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200">Batal</button>
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Simpan Perubahan</button>
        </div>
      </form>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3"><LayoutDashboard className="h-6 w-6 text-blue-600" /><h1 className="text-xl font-bold text-gray-900">Admin Latihan</h1></div>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"><Plus className="h-4 w-4" />Tambah Latihan</button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900">Koneksi Google Drive</h2>
              <p className="text-sm text-gray-600">Dapatkan Access Token OAuth untuk upload dan bagikan file kepada publik.</p>
            </div>
            {(googleConnected || googleAccessToken) && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Terhubung</span>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => { window.location.assign('/api/google-drive/token?oauth=start') }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              {(googleConnected || googleAccessToken) ? 'Hubungkan Ulang Google Drive' : 'Hubungkan dengan Google'}
            </button>
            {googleTokenStatus && <p className="text-sm text-gray-700">{googleTokenStatus}</p>}
          </div>
        </section>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative"><Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari latihan..." className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-500" /></div>
          <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900"><option value="all">Semua Kategori</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
          <select value={filterDifficulty} onChange={(event) => setFilterDifficulty(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900"><option value="all">Semua Tingkat</option><option value="beginner">Pemula</option><option value="intermediate">Menengah</option><option value="advanced">Lanjutan</option></select>
          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900"><option value="all">Semua Status</option><option value="draft">Draft</option><option value="published">Dipublikasikan</option><option value="archived">Arsip</option></select>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Latihan</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Kategori</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tingkat</th><th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th><th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Aksi</th></tr></thead>
              <tbody className="divide-y divide-gray-200">{filteredExercises.map((exercise) => <tr key={exercise.id} className="text-gray-700"><td className="px-4 py-4"><div className="font-medium text-gray-900">{exercise.title}</div><div className="text-sm text-gray-500">/{exercise.slug}</div></td><td className="px-4 py-4">{getCategoryName(exercise.category_id)}</td><td className="px-4 py-4 capitalize">{exercise.difficulty}</td><td className="px-4 py-4"><span className={cn('rounded-full px-2 py-1 text-xs font-medium', statusStyles[exercise.status])}>{statusLabels[exercise.status]}</span></td><td className="px-4 py-4 text-right"><button onClick={() => openEditExercise(exercise)} className="mr-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" />Edit</button><button onClick={() => handleDelete(exercise.id)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" />Hapus</button></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </main>
      {showCreateModal && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"><h2 className="mb-5 text-xl font-bold text-gray-900">Tambah Latihan</h2>{renderCreateForm()}</div></div>}
      {editingExercise && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"><h2 className="mb-5 text-xl font-bold text-gray-900">Edit Latihan</h2>{renderEditForm()}</div></div>}
    </div>
  )
}