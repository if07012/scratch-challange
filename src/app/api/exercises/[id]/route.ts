import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .select('*, categories(*)')
    .eq('id', id)
    .single()

  if (exerciseError || !exercise) {
    return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
  }

  const { data: checklists, error: checklistError } = await supabase
    .from('exercise_checklists')
    .select('*')
    .eq('exercise_id', id)
    .order('sort_order', { ascending: true })

  if (checklistError) {
    console.error('Error fetching checklists:', checklistError)
  }

  return NextResponse.json({
    exercise: {
      ...exercise,
      categories: exercise.categories,
      checklists: checklists || [],
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const body = await request.json()
  const { category_id, title, slug, short_description, case_description, problem_statement, instructions, learning_objectives, difficulty, estimated_minutes, thumbnail_url, scratch_file_url, scratch_file_name, scratch_file_type, video_url, video_type, status, sort_order } = body

  const { data, error } = await supabase
    .from('exercises')
    .update({
      category_id,
      title,
      slug,
      short_description,
      case_description,
      problem_statement,
      instructions: instructions || [],
      learning_objectives: learning_objectives || [],
      difficulty,
      estimated_minutes,
      thumbnail_url,
      scratch_file_url,
      scratch_file_name,
      scratch_file_type,
      video_url,
      video_type,
      status,
      sort_order,
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Exercise not found or you do not have permission to update it' }, { status: 404 })
  }

  return NextResponse.json({ exercise: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}