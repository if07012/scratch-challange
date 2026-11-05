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