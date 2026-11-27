const TOKEN_URL = 'https://oauth2.googleapis.com/token'

let cached: { token: string; expiresAt: number } | null = null

export function isGoogleDriveConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    process.env.GOOGLE_DRIVE_FOLDER_ID,
  )
}

// Single storage identity: every admin/student upload uses this account's token,
// so files always land in GOOGLE_DRIVE_FOLDER_ID regardless of who is logged in.
export async function getGoogleDriveToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive belum dikonfigurasi: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN')
  }

  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await response.json() as { access_token?: string; expires_in?: number; error?: string; error_description?: string }
  if (!response.ok || !data.access_token) {
    cached = null
    throw new Error(data.error_description || data.error || 'Gagal mengambil Google Drive token')
  }

  cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 }
  return cached.token
}
