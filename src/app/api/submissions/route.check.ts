// ponytail: one runnable check for submission file-location parsing. Run:
//   node --experimental-strip-types src/app/api/submissions/route.check.ts
import assert from 'node:assert/strict'

// Mirrors supabaseUploadPath (import-free so the check needs no Next runtime).
function supabaseUploadPath(url: string): string | null {
  const marker = '/storage/v1/object/public/uploads/'
  const index = url.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0]) || null
}

assert.equal(
  supabaseUploadPath('https://abc.supabase.co/storage/v1/object/public/uploads/user-1/uuid-my_project.sb3'),
  'user-1/uuid-my_project.sb3',
)
assert.equal(
  supabaseUploadPath('https://abc.supabase.co/storage/v1/object/public/uploads/user-1/a%20b.sb3?x=1'),
  'user-1/a b.sb3',
)
assert.equal(supabaseUploadPath('/api/upload?id=drive-id&kind=file'), null, 'Drive URLs have no Supabase path')
assert.equal(supabaseUploadPath('https://abc.supabase.co/storage/v1/object/public/other/x.sb3'), null, 'only the uploads bucket')
assert.equal(supabaseUploadPath('https://abc.supabase.co/storage/v1/object/public/uploads/'), null, 'empty path is not a key')

// Ownership gate mirrors deleteStoredFile: the first path segment must be the
// progress owner's id, so a tampered URL cannot delete another student's file.
function ownsPath(url: string, ownerId: string) {
  const path = supabaseUploadPath(url)
  return Boolean(path && path.split('/')[0] === ownerId)
}
assert.ok(ownsPath('https://abc.supabase.co/storage/v1/object/public/uploads/user-1/x.sb3', 'user-1'))
assert.ok(!ownsPath('https://abc.supabase.co/storage/v1/object/public/uploads/user-2/x.sb3', 'user-1'), 'other user’s file rejected')
assert.ok(!ownsPath('https://abc.supabase.co/storage/v1/object/public/uploads/user-10/x.sb3', 'user-1'), 'prefix ids do not match')

console.log('admin submission delete check: ok')
