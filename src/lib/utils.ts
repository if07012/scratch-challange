import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGoogleDriveId(url: string | null | undefined): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url, 'http://localhost')
    const queryId = parsed.searchParams.get('id')
    if (queryId) return queryId

    const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/)
    if (fileMatch?.[1]) return fileMatch[1]
  } catch {
    return null
  }

  return null
}

export function getGoogleDriveMediaUrl(url: string | null | undefined, kind: 'video' | 'thumbnail'): string | null {
  if (!url) return null
  if (url.startsWith('/api/upload?')) return url

  const id = getGoogleDriveId(url)
  if (!id) return url
  return `/api/upload?id=${encodeURIComponent(id)}&kind=${kind}`
}

// Legacy rows stored a video URL as the thumbnail; skip those so next/image never gets a video.
export function getThumbnailSrc(url: string | null | undefined): string | null {
  const resolved = getGoogleDriveMediaUrl(url, 'thumbnail')
  if (!resolved || /\.(mp4|webm|ogg|mov|sb3)$/i.test(resolved)) return null
  if (resolved.startsWith('/api/upload?')) return resolved
  return resolved
}

// Seek a little into the clip: frame 0 is often black.
export function pickFrameTime(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  return Math.min(1, duration / 2)
}

// Grab one frame in the browser (no ffmpeg) so the uploader can store a real thumbnail.
export async function captureVideoThumbnail(file: File, name = 'thumbnail.jpg'): Promise<File | null> {
  if (typeof document === 'undefined') return null
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.muted = true
  video.playsInline = true
  video.src = url

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.currentTime = pickFrameTime(video.duration)
      }
      video.onseeked = () => resolve()
      video.onerror = () => reject(new Error('Video tidak dapat dibaca'))
    })

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 360
    const context = canvas.getContext('2d')
    if (!context) return null
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    return blob ? new File([blob], name, { type: 'image/jpeg' }) : null
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
    video.removeAttribute('src')
  }
}