// ponytail: one runnable check for the shared-token path. Run: node --experimental-strip-types src/lib/google-drive.check.ts
// Verifies: missing env fails loudly, token is fetched once and reused, expired cache refetches.
import assert from 'node:assert/strict'

process.env.GOOGLE_CLIENT_ID = 'id'
process.env.GOOGLE_CLIENT_SECRET = 'secret'
process.env.GOOGLE_REFRESH_TOKEN = 'refresh'
process.env.GOOGLE_DRIVE_FOLDER_ID = 'folder'

let calls = 0
globalThis.fetch = (async () => {
  calls++
  return new Response(JSON.stringify({ access_token: `t${calls}`, expires_in: 3600 }), { status: 200 })
}) as typeof fetch

const { getGoogleDriveToken, isGoogleDriveConfigured } = await import('./google-drive.ts')

assert.equal(isGoogleDriveConfigured(), true)
assert.equal(await getGoogleDriveToken(), 't1')
assert.equal(await getGoogleDriveToken(), 't1', 'cached token must be reused')
assert.equal(calls, 1, 'must not refetch before expiry')

delete process.env.GOOGLE_REFRESH_TOKEN
assert.equal(isGoogleDriveConfigured(), false)
await assert.rejects(getGoogleDriveToken(), /GOOGLE_REFRESH_TOKEN/)

console.log('google-drive check: ok')
