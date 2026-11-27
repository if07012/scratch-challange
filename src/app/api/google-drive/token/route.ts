import { createClient } from '@/lib/supabase/server'
import { isGoogleDriveConfigured } from '@/lib/google-drive'
import { NextRequest, NextResponse } from 'next/server'

// One-time setup helper: an admin signs in with the Google account that owns
// GOOGLE_DRIVE_FOLDER_ID and copies the returned refresh token into the env.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const callbackUrl = new URL('/api/google-drive/token', request.url).toString()

  if (request.nextUrl.searchParams.get('oauth') === 'start') {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) return NextResponse.redirect(new URL('/admin?google=missing_config', request.url))

    const state = crypto.randomUUID()
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || callbackUrl,
      response_type: 'code',
      // ponytail: full drive scope so the one-time owner consent can write into
      // any folder they own; switch to drive.file + Picker if this ever goes public.
      scope: 'https://www.googleapis.com/auth/drive',
      access_type: 'offline',
      prompt: 'consent',
      state,
    })
    const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
    response.cookies.set('google_oauth_state', state, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 600,
    })
    return response
  }

  if (request.nextUrl.searchParams.has('code') || request.nextUrl.searchParams.has('error')) {
    const oauthError = request.nextUrl.searchParams.get('error')
    if (oauthError) return NextResponse.redirect(new URL(`/admin?google=${encodeURIComponent(oauthError)}`, request.url))

    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const savedState = request.cookies.get('google_oauth_state')?.value
    if (!code || !state || !savedState || state !== savedState) {
      return NextResponse.redirect(new URL('/admin?google=invalid_callback', request.url))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/admin?google=missing_config', request.url))

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || callbackUrl,
      }),
    })
    const tokenData = await tokenResponse.json() as { refresh_token?: string; error_description?: string; error?: string }
    if (!tokenResponse.ok || !tokenData.refresh_token) {
      const message = encodeURIComponent(tokenData.error_description || tokenData.error || 'refresh_token_missing')
      return NextResponse.redirect(new URL(`/admin?google=${message}`, request.url))
    }

    const response = new NextResponse(
      `<!doctype html><meta charset="utf-8"><title>Google Drive</title>
<body style="font:16px system-ui;max-width:44rem;margin:4rem auto;padding:0 1rem">
<h1>Refresh token</h1>
<p>Salin nilai ini ke <code>.env.local</code> / environment produksi sebagai <code>GOOGLE_REFRESH_TOKEN</code>, lalu hapus halaman ini dari riwayat browser.</p>
<textarea readonly style="width:100%;height:9rem;font-family:monospace" onclick="this.select()">${tokenData.refresh_token}</textarea>
<p><a href="/admin">Kembali ke admin</a></p></body>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
    )
    response.cookies.delete('google_oauth_state')
    return response
  }

  return NextResponse.json({ configured: isGoogleDriveConfigured() })
}
