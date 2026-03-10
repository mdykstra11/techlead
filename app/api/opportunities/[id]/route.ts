import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OpportunityStatus } from '@/types'

const VALID_STATUSES: OpportunityStatus[] = [
  'submitted', 'reviewed', 'contacted', 'quoted', 'won', 'lost',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only office users can update opportunities
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'office') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: {
    status?: string
    office_notes?: string
    assigned_to?: string
    estimated_value?: number | null
    closed_value?: number | null
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Get current opportunity for status change tracking
  const { data: current } = await supabase
    .from('opportunities')
    .select('status')
    .eq('id', id)
    .single()

  if (!current) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
  }

  // Validate status if provided
  if (body.status && !VALID_STATUSES.includes(body.status as OpportunityStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Build update payload
  const updates: Record<string, unknown> = {}
  if (body.status !== undefined) updates.status = body.status
  if (body.office_notes !== undefined) updates.office_notes = body.office_notes
  if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to
  if (body.estimated_value !== undefined) updates.estimated_value = body.estimated_value
  if (body.closed_value !== undefined) updates.closed_value = body.closed_value

  const { error: updateError } = await supabase
    .from('opportunities')
    .update(updates)
    .eq('id', id)

  if (updateError) {
    console.error('[opportunities PATCH] error:', updateError)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  // Record status change in history
  if (body.status && body.status !== current.status) {
    await supabase.from('opportunity_status_history').insert({
      opportunity_id: id,
      old_status: current.status,
      new_status: body.status,
      changed_by: user.id,
    })
  }

  return NextResponse.json({ success: true })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: opp, error } = await supabase
    .from('opportunities')
    .select(`
      *,
      customer_site:customer_sites(*),
      opportunity_photos(*),
      technician:profiles!opportunities_technician_id_fkey(name, email)
    `)
    .eq('id', id)
    .single()

  if (error || !opp) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Technicians can only view their own
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'office' && opp.technician_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(opp)
}
