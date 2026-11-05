import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createSign } from 'node:crypto'

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function getGoogleAccessToken() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) return null
  const account = JSON.parse(raw) as { client_email: string; private_key: string; token_uri?: string }
  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: account.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${payload}`)
  const assertion = `${header}.${payload}.${base64Url(signer.sign(account.private_key))}`
  const response = await fetch(account.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  })
  if (!response.ok) throw new Error('Google Drive authentication failed')
  const data = await response.json() as { access_token: string }
  return data.access_token
}

async function uploadToGoogleDrive(file: File, kind: 'image' | 'video' | 'scratch', googleAccessToken?: string) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is not configured')
  const token = googleAccessToken || await getGoogleAccessToken()
  if (!token) throw new Error('Configure Google OAuth credentials or GOOGLE_SERVICE_ACCOUNT_JSON')

  const uploadWithParent = async (parentId?: string) => {
    const metadata = {
      name: file.name,
      mimeType: file.type,
      ...(parentId ? { parents: [parentId] } : {}),
    }
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', file)

    return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,webContentLink', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
  }

  let response = await uploadWithParent(folderId)
  if (!response.ok) {
    const parentError = await response.text()
    console.error('Google Drive folder upload failed:', parentError)

    if (parentError.includes('insufficientParentPermissions') || parentError.includes('notFound')) {
      response = await uploadWithParent()
    } else {
      throw new Error('Google Drive upload failed')
    }
  }
  if (!response.ok) {
    console.error('Google Drive upload failed:', await response.text())
    throw new Error('Google Drive upload failed')
  }
  const data = await response.json() as { id: string; webContentLink?: string }

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
      ? (data.webContentLink || `/api/upload?id=${encodeURIComponent(data.id)}&kind=video`)
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
        const token = await getGoogleAccessToken()
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

  const googleAccessToken = String(form.get('google_access_token') || request.cookies.get('google_access_token')?.value || '').trim() || undefined
  const kindParam = String(form.get('kind') || '').trim()
  const kind = kindParam === 'video' ? 'video' : kindParam === 'scratch' ? 'scratch' : 'image'

  if (kind === 'scratch' && !/\.sb3$/i.test(file.name)) {
    return NextResponse.json({ error: 'File Scratch harus berformat .sb3' }, { status: 400 })
  }

  try {
    const result = await uploadToGoogleDrive(file, kind, googleAccessToken)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed' }, { status: 500 })
  }
}
