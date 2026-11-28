import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { syncCategories } from '@/lib/exercise-categories'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .select('*')
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

  const { data: links } = await supabase
    .from('exercise_categories')
    .select('category_id')
    .eq('exercise_id', id)

  const linkIds = (links || []).map((row) => row.category_id)
  const category_ids = exercise.category_id && linkIds.includes(exercise.category_id)
    ? [exercise.category_id, ...linkIds.filter((categoryId) => categoryId !== exercise.category_id)]
    : linkIds.length ? linkIds : exercise.category_id ? [exercise.category_id] : []

  const { data: categoryRows } = category_ids.length
    ? await supabase.from('categories').select('*').in('id', category_ids)
    : { data: [] }

  const byId = new Map((categoryRows || []).map((category) => [category.id, category]))
  const categoryList = category_ids.map((categoryId) => byId.get(categoryId)).filter(Boolean)

  return NextResponse.json({
    exercise: {
      ...exercise,
      categories: categoryList[0] ?? null,
      categoryList,
      category_ids,
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
  const { category_id, category_ids, title, slug, short_description, case_description, problem_statement, instructions, learning_objectives, difficulty, estimated_minutes, thumbnail_url, scratch_file_url, scratch_file_name, scratch_file_type, video_url, video_type, status, sort_order } = body
  const categoryIds: string[] | null = Array.isArray(category_ids) ? category_ids.filter(Boolean) : null
  const primaryCategoryId = category_id !== undefined ? category_id || null : categoryIds?.[0] ?? null

  const { data, error } = await supabase
    .from('exercises')
    .update({
      ...(category_id !== undefined || categoryIds ? { category_id: primaryCategoryId } : {}),
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

  if (categoryIds) {
    const syncError = await syncCategories(supabase, data.id, categoryIds)
    if (syncError) {
      return NextResponse.json({ exercise: data, warning: `Latihan diperbarui, tetapi kategori gagal disimpan: ${syncError}` })
    }
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