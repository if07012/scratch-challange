import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {

  const oauthAction = request.nextUrl.searchParams.get('oauth')
  const callbackUrl = new URL('/api/google-drive/token', request.url).toString()

  if (oauthAction === 'start') {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || callbackUrl
    if (!clientId) {
      return NextResponse.redirect(new URL('/admin?google=missing_config', request.url))
    }
    const state = crypto.randomUUID()
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive.file',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state,
    })
    const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
    response.cookies.set('google_oauth_state', state, {
      httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 600,
    })
    return response
  }

  if (oauthAction === 'callback' || request.nextUrl.searchParams.has('code') || request.nextUrl.searchParams.has('error')) {
    const oauthError = request.nextUrl.searchParams.get('error')
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const savedState = request.cookies.get('google_oauth_state')?.value
    if (oauthError) return NextResponse.redirect(new URL(`/admin?google=${encodeURIComponent(oauthError)}`, request.url))
    if (!code || !state || !savedState || state !== savedState) {
      return NextResponse.redirect(new URL('/admin?google=invalid_callback', request.url))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || callbackUrl
    if (!clientId || !clientSecret) return NextResponse.redirect(new URL('/admin?google=missing_config', request.url))

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: redirectUri }),
    })
    const tokenData = await tokenResponse.json() as { access_token?: string; refresh_token?: string; expires_in?: number; error_description?: string; error?: string }
    if (!tokenResponse.ok || !tokenData.access_token) {
      const message = encodeURIComponent(tokenData.error_description || tokenData.error || 'token_exchange_failed')
      return NextResponse.redirect(new URL(`/admin?google=${message}`, request.url))
    }

    const expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000
    const response = NextResponse.redirect(new URL('/admin?google=connected', request.url))
    const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' }
    response.cookies.set('google_access_token', tokenData.access_token, { ...cookieOptions, maxAge: tokenData.expires_in || 3600 })
    response.cookies.set('google_token_expires_at', String(expiresAt), { ...cookieOptions, maxAge: tokenData.expires_in || 3600 })
    if (tokenData.refresh_token) response.cookies.set('google_refresh_token', tokenData.refresh_token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 365 })
    response.cookies.delete('google_oauth_state')
    return response
  }

  const expiresAt = Number(request.cookies.get('google_token_expires_at')?.value || 0)
  const hasAccessToken = Boolean(request.cookies.get('google_access_token')?.value)
  return NextResponse.json({ connected: hasAccessToken && expiresAt > Date.now(), expiresAt })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const clientId = String(body.clientId || '').trim()
  const clientSecret = String(body.clientSecret || '').trim()
  const refreshToken = String(body.refreshToken || '').trim()

  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json({ error: 'Client ID, Client Secret, and Refresh Token are required' }, { status: 400 })
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  const data = await response.json() as {
    access_token?: string
    expires_in?: number
    token_type?: string
    error?: string
    error_description?: string
  }

  if (!response.ok || !data.access_token) {
    return NextResponse.json({
      error: data.error_description || data.error || 'Failed to get Google access token',
    }, { status: response.status || 400 })
  }

  return NextResponse.json({
    accessToken: data.access_token,
    expiresIn: data.expires_in || 3600,
  })
}
