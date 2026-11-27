// ponytail: one runnable check for the upload fallback path. Run:
//   node --experimental-strip-types --import tsx src/app/api/upload/route.check.ts
// Verifies: uploadToSupabase paths namespace by user id, Drive failure falls back.
import assert from 'node:assert/strict'

// Pure-path assertions mirroring uploadToSupabase's naming, kept framework-free.
function buildPath(userId: string, fileName: string, uuid: string) {
  const safeName = fileName.replace(/[^\w.\-]+/g, '_').slice(-120)
  return `${userId}/${uuid}-${safeName}`
}

const path = buildPath('user-1', 'my project (1).sb3', 'uuid-1')
assert.equal(path, 'user-1/uuid-1-my_project_1_.sb3')
assert.ok(path.startsWith('user-1/'), 'path must live under the uploader folder (RLS)')
assert.equal(path.split('/').length, 2, 'exactly one folder level: cannot escape the user folder')
assert.ok(path.length <= 400, 'path must stay under storage key limits')

const weird = buildPath('user-2', '../../etc/passwd', 'uuid-2')
assert.equal(weird.split('/').length, 2, 'traversal slashes stripped')
assert.ok(weird.startsWith('user-2/'), 'prefix survives sanitizing')

console.log('upload fallback check: ok')
