import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { distanceMiles } from '@/lib/utils'
import { CustomerSite } from '@/types'

// Maximum radius for nearby site lookup (miles)
const MAX_RADIUS_MILES = 50
const MAX_RESULTS = 30

/**
 * GET /api/sites
 * Fetch customer sites, ordered by distance if lat/lng provided, or by search query.
 *
 * Query params:
 *   lat, lng    - technician GPS coordinates (optional)
 *   q           - search string (customer name, address, location number)
 *
 * INTEGRATION NOTE:
 * This endpoint currently reads from the customer_sites Supabase table.
 * To integrate with an external CRM (e.g., ServiceTitan, FieldRoutes),
 * replace the Supabase query below with an HTTP call to the CRM's API.
 * The response shape should match CustomerSite[].
 */
export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const latStr = searchParams.get('lat')
  const lngStr = searchParams.get('lng')
  const query = searchParams.get('q')?.trim() ?? ''

  const lat = latStr ? parseFloat(latStr) : null
  const lng = lngStr ? parseFloat(lngStr) : null

  // Validate coordinates if provided
  if ((latStr && isNaN(lat!)) || (lngStr && isNaN(lng!))) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  let dbQuery = supabase
    .from('customer_sites')
    .select('*')
    .eq('active', true)

  // Text search across name, address, location number
  if (query) {
    dbQuery = dbQuery.or(
      `customer_name.ilike.%${query}%,address_1.ilike.%${query}%,location_number.ilike.%${query}%,city.ilike.%${query}%`
    )
  }

  // If no search query and we have coords, roughly limit by bounding box first
  // (avoids loading thousands of sites). 1 degree lat ≈ 69 miles.
  if (!query && lat !== null && lng !== null) {
    const latDelta = MAX_RADIUS_MILES / 69
    const lngDelta = MAX_RADIUS_MILES / (69 * Math.cos((lat * Math.PI) / 180))
    dbQuery = dbQuery
      .gte('lat', lat - latDelta)
      .lte('lat', lat + latDelta)
      .gte('lng', lng - lngDelta)
      .lte('lng', lng + lngDelta)
  }

  dbQuery = dbQuery.limit(200) // Load more than needed, then sort

  const { data: sites, error } = await dbQuery

  if (error) {
    console.error('[sites] DB error:', error)
    return NextResponse.json({ error: 'Failed to load sites' }, { status: 500 })
  }

  let result: CustomerSite[] = sites ?? []

  // Sort by distance if coordinates available
  if (lat !== null && lng !== null) {
    result = result
      .map((site) => ({
        ...site,
        distance_miles: distanceMiles(lat, lng, site.lat, site.lng),
      }))
      .filter((site) => (site.distance_miles ?? 0) <= MAX_RADIUS_MILES)
      .sort((a, b) => (a.distance_miles ?? 0) - (b.distance_miles ?? 0))
  } else {
    // No coords — sort alphabetically
    result = result.sort((a, b) =>
      a.customer_name.localeCompare(b.customer_name)
    )
  }

  return NextResponse.json({ sites: result.slice(0, MAX_RESULTS) })
}
