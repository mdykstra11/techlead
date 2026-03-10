import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { STATUS_COLORS, STATUS_LABELS, formatDate, CATEGORY_ICONS } from '@/lib/utils'
import { OpportunityStatus } from '@/types'

export default async function MyOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { status: filterStatus } = await searchParams

  let query = supabase
    .from('opportunities')
    .select(`
      id, status, created_at, suggested_service_category, issue_detected, high_priority,
      customer_site:customer_sites(customer_name, address_1, city),
      opportunity_photos(photo_url)
    `)
    .eq('technician_id', user!.id)
    .order('created_at', { ascending: false })

  if (filterStatus) {
    query = query.eq('status', filterStatus)
  }

  const { data: opportunities } = await query

  const statuses: OpportunityStatus[] = ['submitted', 'reviewed', 'contacted', 'quoted', 'won', 'lost']

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">My Opportunities</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
        <Link
          href="/opportunities"
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !filterStatus ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/opportunities?status=${s}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === s ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* List */}
      {opportunities && opportunities.length > 0 ? (
        <div className="space-y-3">
          {opportunities.map((opp) => {
            const site = opp.customer_site as { customer_name: string; address_1: string; city: string } | null
            const photo = (opp.opportunity_photos as { photo_url: string }[] | null)?.[0]
            const status = opp.status as OpportunityStatus
            const category = opp.suggested_service_category as string | null

            return (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="card flex items-center gap-3 active:bg-gray-50 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">
                      {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ?? '📋'}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {site?.customer_name ?? 'Unknown Site'}
                    </p>
                    {opp.high_priority && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {category ?? opp.issue_detected ?? 'No category'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`status-badge ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(opp.created_at)}</span>
                  </div>
                </div>

                <ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-gray-600">No opportunities found</p>
          {filterStatus && (
            <Link href="/opportunities" className="text-brand-600 text-sm mt-1 block">
              Clear filter
            </Link>
          )}
          {!filterStatus && (
            <Link href="/opportunities/new" className="btn-primary mt-4 max-w-xs mx-auto">
              Submit your first opportunity
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}
