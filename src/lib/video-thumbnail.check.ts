// ponytail: one runnable check for frame-picking logic. Run:
//   node --experimental-strip-types --import tsx src/lib/video-thumbnail.check.ts
import assert from 'node:assert/strict'

function pickFrameTime(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  return Math.min(1, duration / 2)
}

assert.equal(pickFrameTime(10), 1, 'seeks 1s into a normal clip')
assert.equal(pickFrameTime(0.5), 0.25, 'short clip seeks to its midpoint')
assert.equal(pickFrameTime(0), 0, 'zero duration stays at 0')
assert.equal(pickFrameTime(NaN), 0, 'NaN duration stays at 0')
assert.equal(pickFrameTime(Infinity), 0, 'Infinity duration stays at 0')

console.log('video thumbnail check: ok')
