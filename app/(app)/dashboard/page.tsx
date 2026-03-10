import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { STATUS_COLORS, STATUS_LABELS, formatDate, CATEGORY_ICONS } from '@/lib/utils'
import { OpportunityStatus } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const isOffice = profile?.role === 'office'

  // Fetch stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let query = supabase.from('opportunities').select('status, created_at, suggested_service_category', { count: 'exact' })
  if (!isOffice) {
    query = query.eq('technician_id', user!.id)
  }

  const { data: opportunities } = await query

  const todayCount = opportunities?.filter(
    (o) => new Date(o.created_at) >= today
  ).length ?? 0

  const openCount = opportunities?.filter(
    (o) => !['won', 'lost'].includes(o.status)
  ).length ?? 0

  const wonCount = opportunities?.filter((o) => o.status === 'won').length ?? 0

  // Recent opportunities
  let recentQuery = supabase
    .from('opportunities')
    .select(`
      id, status, created_at, suggested_service_category, issue_detected,
      customer_site:customer_sites(customer_name, address_1, city),
      opportunity_photos(photo_url)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!isOffice) {
    recentQuery = recentQuery.eq('technician_id', user!.id)
  }

  const { data: recentOpps } = await recentQuery

  const greeting = getGreeting()
  const name = profile?.name || 'there'

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <p className="text-gray-500 text-sm">{greeting}</p>
        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
        {isOffice && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-medium mt-1">
            Office View
          </span>
        )}
      </div>

      {/* Primary CTA — always first for technicians */}
      {!isOffice && (
        <Link
          href="/opportunities/new"
          className="btn-primary text-lg py-5 shadow-lg shadow-brand-200"
        >
          <PlusCircleIcon />
          New Opportunity
        </Link>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Today" value={todayCount} color="blue" />
        <StatCard label="Open" value={openCount} color="yellow" />
        <StatCard label="Won" value={wonCount} color="green" />
      </div>

      {/* Quick Actions for Office */}
      {isOffice && (
        <Link href="/office" className="btn-primary">
          <ChartIcon />
          View Pipeline
        </Link>
      )}

      {/* Recent Opportunities */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">
            {isOffice ? 'Recent Submissions' : 'My Recent'}
          </h2>
          <Link href={isOffice ? '/office' : '/opportunities'} className="text-brand-600 text-sm font-medium">
            See all
          </Link>
        </div>

        {recentOpps && recentOpps.length > 0 ? (
          <div className="space-y-3">
            {recentOpps.map((opp) => {
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
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
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
                    <p className="font-medium text-gray-900 truncate">
                      {site?.customer_name ?? 'Unknown Site'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {category ?? opp.issue_detected ?? 'No category'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(opp.created_at)}
                    </p>
                  </div>

                  <span className={`status-badge ${STATUS_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="card text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">No opportunities yet.</p>
            {!isOffice && (
              <Link href="/opportunities/new" className="text-brand-600 text-sm font-medium mt-1 block">
                Submit your first one
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'yellow' | 'green' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
  }

  return (
    <div className={`rounded-2xl p-3 text-center ${colorMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5">{label}</p>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning,'
  if (hour < 17) return 'Good afternoon,'
  return 'Good evening,'
}

function PlusCircleIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
