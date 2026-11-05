import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY belum dikonfigurasi' }, { status: 500 })

  const body = await request.json()
  const description = String(body.description || '').trim()
  const problemStatement = String(body.problem_statement || '').trim()
  const title = String(body.title || '').trim()
  const action = String(body.action || 'fix')
  const plainDescription = description.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim()
  const plainProblemStatement = problemStatement.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim()

  const sourceText = action === 'suggest-checklist' ? plainProblemStatement : plainDescription || description
  if (!sourceText) {
    return NextResponse.json({
      error: action === 'suggest-checklist'
        ? 'Pernyataan Masalah wajib diisi sebelum membuat saran checklist'
        : 'Deskripsi kasus wajib diisi sebelum diperbaiki',
    }, { status: 400 })
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: action === 'suggest-checklist' ? 0.2 : 0.35,
      messages: action === 'suggest-checklist'
        ? [
            {
              role: 'system',
              content: 'Anda adalah asisten pembuat tugas Scratch untuk anak SD. Analisis Pernyataan Masalah dan buat checklist hal yang harus diperiksa atau dikerjakan siswa. Gunakan kalimat pendek, jelas, dan berurutan. Kembalikan hanya JSON valid dalam format {"items":["..."]}. Buat maksimal 10 item. Jangan menambahkan markdown atau teks lain.',
            },
            { role: 'user', content: `Judul latihan: ${title || 'Tidak tersedia'}\n\nPernyataan Masalah:\n${sourceText}` },
          ]
        : [
            {
              role: 'system',
              content: 'Anda adalah editor konten pembelajaran Scratch berbahasa Indonesia untuk anak. Perbaiki ejaan, tata bahasa, kejelasan, dan struktur deskripsi kasus. Pertahankan makna dan fakta. Kembalikan hanya HTML aman menggunakan tag p, div, span, br, b, strong, i, em, u, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, dan a. Jangan gunakan script atau atribut berbahaya. Jangan menambahkan penjelasan di luar HTML.',
            },
            { role: 'user', content: `Judul latihan: ${title || 'Tidak tersedia'}\n\nDeskripsi kasus yang perlu diperbaiki:\n${description}` },
          ],
    }),
  })

  const result = await response.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
  if (!response.ok) return NextResponse.json({ error: result.error?.message || 'GroqAI gagal memperbaiki deskripsi' }, { status: 502 })

  const generatedContent = result.choices?.[0]?.message?.content?.trim()
  if (!generatedContent) {
    return NextResponse.json({
      error: action === 'suggest-checklist'
        ? 'GroqAI tidak mengembalikan saran checklist'
        : 'GroqAI tidak mengembalikan deskripsi',
    }, { status: 502 })
  }

  if (action === 'suggest-checklist') {
    try {
      const cleaned = generatedContent.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      const parsed = JSON.parse(cleaned) as { items?: unknown }
      const items = Array.isArray(parsed.items)
        ? parsed.items
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim().replace(/^[-•]\s*/, ''))
            .filter(Boolean)
            .slice(0, 10)
        : []
      if (!items.length) return NextResponse.json({ error: 'GroqAI tidak menghasilkan checklist yang valid' }, { status: 502 })
      return NextResponse.json({ items: [...new Set(items)] })
    } catch {
      return NextResponse.json({ error: 'Format saran checklist dari GroqAI tidak valid' }, { status: 502 })
    }
  }

  return NextResponse.json({ description: generatedContent.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '').trim() })
}
