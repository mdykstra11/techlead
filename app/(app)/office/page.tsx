import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { STATUS_COLORS, STATUS_LABELS, formatDate, CATEGORY_ICONS } from '@/lib/utils'
import { OpportunityStatus, ServiceCategory } from '@/types'

export default async function OfficeDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    tech?: string
    category?: string
    from?: string
  }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (profile?.role !== 'office') {
    redirect('/dashboard')
  }

  const { status, tech, category, from } = await searchParams

  // Build query
  let query = supabase
    .from('opportunities')
    .select(`
      id, status, created_at, suggested_service_category, issue_detected, high_priority,
      estimated_value, assigned_to,
      customer_site:customer_sites(customer_name, address_1, city),
      opportunity_photos(photo_url),
      technician:profiles!opportunities_technician_id_fkey(id, name)
    `)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (tech) query = query.eq('technician_id', tech)
  if (category) query = query.eq('suggested_service_category', category)
  if (from) query = query.gte('created_at', from)

  const { data: opportunities } = await query

  // Get technicians for filter
  const { data: technicians } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('role', 'technician')
    .order('name')

  // Stats
  const total = opportunities?.length ?? 0
  const submitted = opportunities?.filter((o) => o.status === 'submitted').length ?? 0
  const won = opportunities?.filter((o) => o.status === 'won').length ?? 0
  const totalValue = opportunities
    ?.filter((o) => o.estimated_value)
    .reduce((sum, o) => sum + (o.estimated_value ?? 0), 0) ?? 0

  const statuses: OpportunityStatus[] = ['submitted', 'reviewed', 'contacted', 'quoted', 'won', 'lost']

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <p className="text-sm text-gray-500">All submitted opportunities</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-blue-50 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-blue-700">{total}</p>
          <p className="text-xs text-blue-600">Total</p>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-yellow-700">{submitted}</p>
          <p className="text-xs text-yellow-600">New</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-green-700">{won}</p>
          <p className="text-xs text-green-600">Won</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-purple-700">
            ${totalValue > 0 ? (totalValue / 1000).toFixed(0) + 'k' : '0'}
          </p>
          <p className="text-xs text-purple-600">Est. Value</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <FilterLink href="/office" active={!status} label="All" />
          {statuses.map((s) => (
            <FilterLink
              key={s}
              href={buildUrl('/office', { status: s, tech, category, from })}
              active={status === s}
              label={STATUS_LABELS[s]}
            />
          ))}
        </div>

        {/* Tech + category filters */}
        <div className="flex gap-2">
          <select
            onChange={(e) => {
              const url = new URL(window.location.href)
              if (e.target.value) url.searchParams.set('tech', e.target.value)
              else url.searchParams.delete('tech')
              window.location.href = url.toString()
            }}
            value={tech ?? ''}
            className="input flex-1 text-sm py-2"
          >
            <option value="">All technicians</option>
            {technicians?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            onChange={(e) => {
              const url = new URL(window.location.href)
              if (e.target.value) url.searchParams.set('category', e.target.value)
              else url.searchParams.delete('category')
              window.location.href = url.toString()
            }}
            value={category ?? ''}
            className="input flex-1 text-sm py-2"
          >
            <option value="">All categories</option>
            {(['General Pest Control Upgrade', 'Termite Opportunity', 'Rodent Opportunity',
               'Mosquito Opportunity', 'Bed Bug Opportunity', 'Cockroach Opportunity',
               'Weed Control Opportunity', 'Lawn Care Opportunity',
               'Inspection Recommended', 'Other'] as ServiceCategory[]).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {opportunities && opportunities.length > 0 ? (
        <div className="space-y-3">
          {opportunities.map((opp) => {
            const site = opp.customer_site as { customer_name: string; address_1: string; city: string } | null
            const photo = (opp.opportunity_photos as { photo_url: string }[] | null)?.[0]
            const technicianInfo = opp.technician as { name: string } | null
            const oppStatus = opp.status as OpportunityStatus
            const cat = opp.suggested_service_category as string | null

            return (
              <Link
                key={opp.id}
                href={`/office/${opp.id}`}
                className="card flex items-center gap-3 active:bg-gray-50 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">
                      {CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] ?? '📋'}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {site?.customer_name ?? 'Unknown'}
                    </p>
                    {opp.high_priority && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{cat ?? 'No category'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`status-badge ${STATUS_COLORS[oppStatus]}`}>
                      {STATUS_LABELS[oppStatus]}
                    </span>
                    <span className="text-xs text-gray-400 truncate">
                      {technicianInfo?.name} · {formatDate(opp.created_at)}
                    </span>
                  </div>
                  {opp.estimated_value && (
                    <p className="text-xs text-green-600 font-medium mt-0.5">
                      ${opp.estimated_value.toLocaleString()} est.
                    </p>
                  )}
                </div>

                <ChevronRightIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">No opportunities match your filters</p>
          <Link href="/office" className="text-brand-600 text-sm mt-2 block">Clear filters</Link>
        </div>
      )}
    </div>
  )
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {label}
    </Link>
  )
}

function buildUrl(base: string, params: Record<string, string | undefined>) {
  const url = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) url.set(k, v)
  }
  const qs = url.toString()
  return qs ? `${base}?${qs}` : base
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}
