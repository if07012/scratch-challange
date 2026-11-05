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
  const title = String(body.title || '').trim()
  if (!description) return NextResponse.json({ error: 'Deskripsi kasus wajib diisi sebelum diperbaiki' }, { status: 400 })

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.35,
      messages: [
        {
          role: 'system',
          content: 'Anda adalah editor konten pembelajaran Scratch berbahasa Indonesia untuk anak. Perbaiki ejaan, tata bahasa, kejelasan, dan struktur deskripsi kasus. Pertahankan makna dan fakta. Kembalikan hanya HTML aman menggunakan tag p, div, span, br, b, strong, i, em, u, h2, h3, ul, ol, li, blockquote, dan a. Jangan gunakan script atau atribut berbahaya. Jangan menambahkan penjelasan di luar HTML.',
        },
        { role: 'user', content: `Judul latihan: ${title || 'Tidak tersedia'}\n\nDeskripsi kasus yang perlu diperbaiki:\n${description}` },
      ],
    }),
  })

  const result = await response.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
  if (!response.ok) return NextResponse.json({ error: result.error?.message || 'GroqAI gagal memperbaiki deskripsi' }, { status: 502 })

  const fixedDescription = result.choices?.[0]?.message?.content?.trim()
  if (!fixedDescription) return NextResponse.json({ error: 'GroqAI tidak mengembalikan deskripsi' }, { status: 502 })

  return NextResponse.json({ description: fixedDescription.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/i, '').trim() })
}
