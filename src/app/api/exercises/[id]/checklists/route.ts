import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const body = await request.json()
  const { description, sort_order } = body

  const { data, error } = await supabase
    .from('exercise_checklists')
    .insert({
      exercise_id: id,
      description,
      sort_order: sort_order || 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ checklist: data }, { status: 201 })
}