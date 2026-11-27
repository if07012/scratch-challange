import { createClient } from '@/lib/supabase/server'
import { getGoogleDriveToken, isGoogleDriveConfigured } from '@/lib/google-drive'
import { NextRequest, NextResponse } from 'next/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type UploadKind = 'image' | 'video' | 'scratch'

// Fallback when Drive is unconfigured or its token/upload fails.
async function uploadToSupabase(supabase: SupabaseClient, file: File, userId: string, kind: UploadKind) {
  const safeName = file.name.replace(/[^\w.\-]+/g, '_').slice(-120)
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`
  const { error } = await supabase.storage.from('uploads').upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (error) {
    throw new Error(
      error.message.includes('Bucket not found')
        ? 'Penyimpanan cadangan belum dibuat: jalankan migration upload_fallback_bucket'
        : `Upload cadangan gagal: ${error.message}`,
    )
  }

  const { data } = supabase.storage.from('uploads').getPublicUrl(path)
  // Only images can be thumbnails; a video/scratch URL here would break next/image.
  return { id: path, url: data.publicUrl, thumbnailUrl: kind === 'image' ? data.publicUrl : null }
}

async function uploadToGoogleDrive(file: File, kind: UploadKind) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured')
  const token = await getGoogleDriveToken()

  const metadata = { name: file.name, mimeType: file.type, parents: [folderId] }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', file)

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!response.ok) {
    console.error('Google Drive upload failed:', await response.text())
    throw new Error('Google Drive upload failed')
  }
  const data = await response.json() as { id: string }

  const permissionResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(data.id)}/permissions?supportsAllDrives=true`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    },
  )
  if (!permissionResponse.ok) {
    console.error('Google Drive public permission failed:', await permissionResponse.text())
    throw new Error('Google Drive file was uploaded, but public access could not be enabled')
  }

  const thumbnailUrl = `/api/upload?id=${encodeURIComponent(data.id)}&kind=thumbnail`
  const downloadUrl = kind === 'scratch'
    ? `/api/upload?id=${encodeURIComponent(data.id)}&kind=file`
    : kind === 'video'
      ? `/api/upload?id=${encodeURIComponent(data.id)}&kind=video`
      : thumbnailUrl
  return { id: data.id, url: downloadUrl, thumbnailUrl }
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const kind = request.nextUrl.searchParams.get('kind') || 'video'
  if (!id) return NextResponse.json({ error: 'Media id is required' }, { status: 400 })

  try {
    let upstream: Response

    if (kind === 'thumbnail') {
      upstream = await fetch(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`, {
        cache: 'no-store',
        redirect: 'follow',
      })

      if (!upstream.ok || !upstream.headers.get('content-type')?.startsWith('image/')) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#e5e7eb"/><path d="M320 120l100 70-100 70-100-70z" fill="#9ca3af"/><text x="320" y="290" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="20">Thumbnail tidak tersedia</text></svg>`
        return new NextResponse(svg, {
          status: 200,
          headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
        })
      }
    } else {
      const range = request.headers.get('range')
      const publicHeaders = new Headers(range ? { Range: range } : undefined)
      upstream = await fetch(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`, {
        headers: publicHeaders,
        cache: 'no-store',
        redirect: 'follow',
      })

      if (!upstream.ok && upstream.status !== 206) {
        const token = await getGoogleDriveToken().catch(() => null)
        if (token) {
          upstream = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`, {
            cache: 'no-store',
            headers: {
              Authorization: `Bearer ${token}`,
              ...(range ? { Range: range } : {}),
            },
          })
        }
      }

      if (!upstream.ok && upstream.status !== 206) {
        return NextResponse.json({ error: 'Media not found or not accessible' }, { status: 404 })
      }
    }

    const headers = new Headers()
    for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
      const value = upstream.headers.get(name)
      if (value) headers.set(name, value)
    }
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Cache-Control', 'public, max-age=3600')

    if (kind === 'file') {
      const requestedName = request.nextUrl.searchParams.get('name')?.trim()
      const safeName = (requestedName || 'project.sb3')
        .replace(/[\r\n"\\/]/g, '_')
        .slice(0, 180)
      const downloadName = /\.sb3$/i.test(safeName) ? safeName : `${safeName}.sb3`
      headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`)
    }

    return new NextResponse(upstream.body, {
      status: upstream.status === 206 ? 206 : 200,
      headers,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load media' }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 })
  }

  const kindParam = String(form.get('kind') || '').trim()
  const kind = kindParam === 'video' ? 'video' : kindParam === 'scratch' ? 'scratch' : 'image'

  if (kind === 'scratch' && !/\.sb3$/i.test(file.name)) {
    return NextResponse.json({ error: 'File Scratch harus berformat .sb3' }, { status: 400 })
  }

  if (!isGoogleDriveConfigured()) {
    try {
      return NextResponse.json(await uploadToSupabase(supabase, file, user.id, kind))
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed' }, { status: 500 })
    }
  }

  try {
    return NextResponse.json(await uploadToGoogleDrive(file, kind))
  } catch (error) {
    console.error('Google Drive upload failed, falling back to Supabase Storage:', error)
    try {
      return NextResponse.json(await uploadToSupabase(supabase, file, user.id, kind))
    } catch (fallbackError) {
      return NextResponse.json({ error: fallbackError instanceof Error ? fallbackError.message : 'Upload failed' }, { status: 500 })
    }
  }
}
