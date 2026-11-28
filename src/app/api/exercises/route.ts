import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { syncCategories } from '@/lib/exercise-categories'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ exercises: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const body = await request.json()
  const { category_id, category_ids, title, slug, short_description, case_description, problem_statement, instructions, learning_objectives, difficulty, estimated_minutes, thumbnail_url, scratch_file_url, scratch_file_name, scratch_file_type, video_url, video_type, status, sort_order } = body
  const categoryIds: string[] = Array.isArray(category_ids) ? category_ids.filter(Boolean) : category_id ? [category_id] : []
  const primaryCategoryId = category_id || categoryIds[0] || null

  const { data, error } = await supabase
    .from('exercises')
    .insert({
      category_id: primaryCategoryId,
      title,
      slug,
      short_description,
      case_description,
      problem_statement,
      instructions: instructions || [],
      learning_objectives: learning_objectives || [],
      difficulty,
      estimated_minutes: estimated_minutes || 30,
      thumbnail_url,
      scratch_file_url,
      scratch_file_name,
      scratch_file_type: scratch_file_type || 'starter',
      video_url,
      video_type: video_type || 'youtube',
      status: status || 'draft',
      sort_order: sort_order || 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const syncError = await syncCategories(supabase, data.id, categoryIds)
  if (syncError) {
    return NextResponse.json({ exercise: data, warning: `Latihan dibuat, tetapi kategori gagal disimpan: ${syncError}` }, { status: 201 })
  }

  return NextResponse.json({ exercise: data }, { status: 201 })
}