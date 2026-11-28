import { getGoogleDriveToken } from '@/lib/google-drive'
import { getGoogleDriveId } from '@/lib/utils'
import { createClient as createAdminClient, type SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Deletes an uploaded Scratch submission: the file itself (Drive or Supabase
// fallback) plus the submission columns on student_progress.
// Allowed for the owning student (their own progress) or an admin (any progress).
// Exercise/checklist progress is left alone.

export function supabaseUploadPath(url: string): string | null {
  const marker = '/storage/v1/object/public/uploads/'
  const index = url.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0]) || null
}

async function deleteStoredFile(url: string, ownerId: string, storage: SupabaseClient) {
  const driveId = url.startsWith('/api/upload?') ? getGoogleDriveId(url) : null
  if (driveId) {
    const token = await getGoogleDriveToken()
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveId)}?supportsAllDrives=true`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
    )
    // 404 = already gone; treat as success.
    if (!response.ok && response.status !== 404) {
      throw new Error(`Gagal menghapus file Drive: ${response.status}`)
    }
    return
  }

  const path = supabaseUploadPath(url)
  if (!path || path.split('/')[0] !== ownerId) {
    throw new Error('Lokasi file tidak dikenali')
  }

  const { error } = await storage.storage.from('uploads').remove([path])
  if (error) throw new Error(`Gagal menghapus file: ${error.message}`)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const exerciseId = typeof body.exercise_id === 'string' ? body.exercise_id : ''
  const isAdmin = user.app_metadata?.role === 'admin'
  const targetUserId = typeof body.user_id === 'string' && body.user_id ? body.user_id : user.id
  if (isAdmin ? !exerciseId || !targetUserId : !exerciseId) {
    return NextResponse.json({ error: 'exercise_id wajib diisi' }, { status: 400 })
  }
  if (!isAdmin && targetUserId !== user.id) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
  }

  // The student client is enough to read: RLS exposes own rows, admin policy exposes all.
  const { data: progress, error: readError } = await supabase
    .from('student_progress')
    .select('submitted_scratch_url')
    .eq('user_id', targetUserId)
    .eq('exercise_id', exerciseId)
    .maybeSingle()

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
  if (!progress?.submitted_scratch_url) {
    return NextResponse.json({ error: 'Tidak ada file unggahan untuk dihapus' }, { status: 404 })
  }

  try {
    // Deleting another user's file needs service role: the uploads bucket only
    // lets the file's own folder (user id) delete. Own files use the caller's JWT.
    let storage: SupabaseClient = supabase
    if (targetUserId !== user.id) {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!serviceKey) {
        return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum diatur' }, { status: 500 })
      }
      storage = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { persistSession: false, autoRefreshToken: false } },
      )
    }
    await deleteStoredFile(progress.submitted_scratch_url, targetUserId, storage)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menghapus file' },
      { status: 502 },
    )
  }

  const { error: updateError } = await supabase
    .from('student_progress')
    .update({ submitted_scratch_url: null, submitted_scratch_name: null, submitted_at: null })
    .eq('user_id', targetUserId)
    .eq('exercise_id', exerciseId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
