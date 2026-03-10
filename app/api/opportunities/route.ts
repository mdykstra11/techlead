import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    customer_site_id: string
    issue_detected?: string
    suggested_service_category?: string
    ai_confidence?: string
    ai_summary?: string
    technician_notes?: string
    customer_mentioned_issue?: boolean
    high_priority?: boolean
    photos?: { photo_url: string; storage_path: string }[]
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.customer_site_id) {
    return NextResponse.json({ error: 'customer_site_id is required' }, { status: 400 })
  }

  // Get user's profile to get company_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  // Insert opportunity
  const { data: opp, error: oppError } = await supabase
    .from('opportunities')
    .insert({
      technician_id: user.id,
      company_id: profile?.company_id ?? null,
      customer_site_id: body.customer_site_id,
      issue_detected: body.issue_detected ?? null,
      suggested_service_category: body.suggested_service_category ?? null,
      ai_confidence: body.ai_confidence ?? null,
      ai_summary: body.ai_summary ?? null,
      technician_notes: body.technician_notes ?? null,
      customer_mentioned_issue: body.customer_mentioned_issue ?? false,
      high_priority: body.high_priority ?? false,
      status: 'submitted',
    })
    .select('id')
    .single()

  if (oppError) {
    console.error('[opportunities POST] error:', oppError)
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 })
  }

  // Insert photos if any
  if (body.photos && body.photos.length > 0) {
    const photoRows = body.photos.map((p) => ({
      opportunity_id: opp.id,
      photo_url: p.photo_url,
      storage_path: p.storage_path,
    }))

    const { error: photoError } = await supabase
      .from('opportunity_photos')
      .insert(photoRows)

    if (photoError) {
      console.error('[opportunities POST] photo insert error:', photoError)
      // Don't fail the whole request, opportunity is created
    }
  }

  // Create initial status history entry
  await supabase.from('opportunity_status_history').insert({
    opportunity_id: opp.id,
    old_status: null,
    new_status: 'submitted',
    changed_by: user.id,
  })

  return NextResponse.json({ id: opp.id }, { status: 201 })
}
