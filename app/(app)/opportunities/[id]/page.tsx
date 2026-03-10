import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  formatDateTime,
  CATEGORY_ICONS,
} from '@/lib/utils'
import { OpportunityStatus } from '@/types'

export default async function OpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ submitted?: string }>
}) {
  const { id } = await params
  const { submitted } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

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

  if (error || !opp) notFound()

  // Technicians can only view their own
  if (profile?.role !== 'office' && opp.technician_id !== user!.id) {
    notFound()
  }

  // Status history
  const { data: history } = await supabase
    .from('opportunity_status_history')
    .select('*, changed_by_profile:profiles!opportunity_status_history_changed_by_fkey(name)')
    .eq('opportunity_id', id)
    .order('created_at', { ascending: true })

  const status = opp.status as OpportunityStatus
  const site = opp.customer_site as Record<string, string> | null
  const photos = opp.opportunity_photos as { id: string; photo_url: string; created_at: string }[] | null
  const technician = opp.technician as { name: string; email: string } | null
  const category = opp.suggested_service_category as string | null

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
      {/* Success banner */}
      {submitted === 'true' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-2xl mb-1">✅</p>
          <p className="font-semibold text-green-800">Opportunity Submitted!</p>
          <p className="text-sm text-green-600">The office team will review this soon.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {site?.customer_name ?? 'Unknown Site'}
          </h1>
          <p className="text-sm text-gray-500">
            {site?.address_1}, {site?.city}, {site?.state}
          </p>
          {site?.location_number && (
            <p className="text-xs text-gray-400">#{site.location_number}</p>
          )}
        </div>
        <span className={`status-badge ${STATUS_COLORS[status]} text-xs flex-shrink-0`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Photos */}
      {photos && photos.length > 0 && (
        <div>
          <p className="label">Photos</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.photo_url}
                alt=""
                className="w-28 h-28 rounded-xl object-cover flex-shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ?? '📋'}
          </span>
          <div>
            <p className="font-semibold text-gray-900">{category ?? 'No category'}</p>
            {opp.ai_confidence && (
              <p className="text-xs text-gray-400">
                AI confidence: {opp.ai_confidence}
              </p>
            )}
          </div>
        </div>

        {opp.issue_detected && (
          <div>
            <p className="label">Issue Detected</p>
            <p className="text-sm text-gray-700">{opp.issue_detected}</p>
          </div>
        )}

        {opp.ai_summary && (
          <div>
            <p className="label">AI Summary</p>
            <p className="text-sm text-gray-700">{opp.ai_summary}</p>
          </div>
        )}

        {opp.technician_notes && (
          <div>
            <p className="label">Technician Notes</p>
            <p className="text-sm text-gray-700">{opp.technician_notes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {opp.customer_mentioned_issue && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              Customer mentioned
            </span>
          )}
          {opp.high_priority && (
            <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">
              High priority
            </span>
          )}
        </div>
      </div>

      {/* Office notes (if any) */}
      {opp.office_notes && (
        <div className="card bg-purple-50 border-purple-200">
          <p className="label">Office Notes</p>
          <p className="text-sm text-gray-700">{opp.office_notes}</p>
          {opp.assigned_to && (
            <p className="text-xs text-gray-400 mt-2">Assigned to: {opp.assigned_to}</p>
          )}
          {opp.estimated_value && (
            <p className="text-xs text-gray-500 mt-1">
              Est. value: ${opp.estimated_value.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Technician info (office only) */}
      {profile?.role === 'office' && technician && (
        <div className="card">
          <p className="label">Submitted by</p>
          <p className="text-sm font-medium text-gray-900">{technician.name || technician.email}</p>
        </div>
      )}

      {/* Status History */}
      {history && history.length > 0 && (
        <div>
          <p className="label mb-2">Status History</p>
          <div className="space-y-2">
            {history.map((h) => {
              const changedByProfile = h.changed_by_profile as { name: string } | null
              return (
                <div key={h.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700">
                      {h.old_status ? (
                        <span>
                          <span className="font-medium">{STATUS_LABELS[h.old_status as OpportunityStatus]}</span>
                          {' → '}
                          <span className="font-medium">{STATUS_LABELS[h.new_status as OpportunityStatus]}</span>
                        </span>
                      ) : (
                        <span className="font-medium">
                          Submitted ({STATUS_LABELS[h.new_status as OpportunityStatus]})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {changedByProfile?.name ?? 'System'} · {formatDateTime(h.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <p className="text-xs text-gray-400 text-center">
        Submitted {formatDateTime(opp.created_at)}
      </p>

      {/* Office edit link */}
      {profile?.role === 'office' && (
        <Link href={`/office/${id}`} className="btn-secondary">
          Edit in Office View
        </Link>
      )}

      {/* Back link */}
      <Link href="/opportunities" className="block text-center text-sm text-brand-600 font-medium py-2">
        ← Back to My Opportunities
      </Link>
    </div>
  )
}
