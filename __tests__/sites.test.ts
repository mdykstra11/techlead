/**
 * Tests for nearby site query logic
 */

import { distanceMiles } from '@/lib/utils'

interface MockSite {
  id: string
  customer_name: string
  lat: number
  lng: number
  distance_miles?: number
}

// Simulate what the /api/sites route does
function filterAndSortSites(
  sites: MockSite[],
  userLat: number,
  userLng: number,
  maxRadius = 50
): MockSite[] {
  return sites
    .map((site) => ({
      ...site,
      distance_miles: distanceMiles(userLat, userLng, site.lat, site.lng),
    }))
    .filter((site) => (site.distance_miles ?? 0) <= maxRadius)
    .sort((a, b) => (a.distance_miles ?? 0) - (b.distance_miles ?? 0))
}

// Mock sites in Phoenix area
const mockSites: MockSite[] = [
  { id: '1', customer_name: 'Site A - Nearby', lat: 33.4952, lng: -111.9261 }, // ~1 mile from ref
  { id: '2', customer_name: 'Site B - Medium', lat: 33.55, lng: -112.0 },      // ~7 miles
  { id: '3', customer_name: 'Site C - Far', lat: 33.8, lng: -112.3 },          // ~26 miles
  { id: '4', customer_name: 'Site D - Very Far', lat: 34.5, lng: -113.0 },     // ~85+ miles
]

// Reference point: Scottsdale area
const REF_LAT = 33.4942
const REF_LNG = -111.9261

describe('Nearby site filtering', () => {
  it('returns sites within radius sorted by distance', () => {
    const result = filterAndSortSites(mockSites, REF_LAT, REF_LNG)
    // Should exclude very far site
    expect(result.every((s) => (s.distance_miles ?? 0) <= 50)).toBe(true)
    // Should be sorted
    for (let i = 1; i < result.length; i++) {
      expect(result[i].distance_miles!).toBeGreaterThanOrEqual(result[i - 1].distance_miles!)
    }
  })

  it('excludes sites beyond max radius', () => {
    const result = filterAndSortSites(mockSites, REF_LAT, REF_LNG, 50)
    const ids = result.map((s) => s.id)
    expect(ids).not.toContain('4') // Very far site should be excluded
  })

  it('puts closest site first', () => {
    const result = filterAndSortSites(mockSites, REF_LAT, REF_LNG)
    expect(result[0].id).toBe('1') // Nearest site
  })

  it('returns empty array when no sites within radius', () => {
    // Use a remote location (e.g., middle of Atlantic)
    const result = filterAndSortSites(mockSites, 40.0, -30.0, 50)
    expect(result).toHaveLength(0)
  })

  it('returns all sites when radius is very large', () => {
    const result = filterAndSortSites(mockSites, REF_LAT, REF_LNG, 10000)
    expect(result).toHaveLength(mockSites.length)
  })
})

describe('Site text search (mock)', () => {
  function searchSites(sites: MockSite[], query: string): MockSite[] {
    const q = query.toLowerCase()
    return sites.filter(
      (s) =>
        s.customer_name.toLowerCase().includes(q)
    )
  }

  it('finds site by partial name', () => {
    const result = searchSites(mockSites, 'Nearby')
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('1')
  })

  it('returns empty when no match', () => {
    const result = searchSites(mockSites, 'NOMATCH_XYZ')
    expect(result).toHaveLength(0)
  })

  it('is case insensitive', () => {
    const result = searchSites(mockSites, 'site a')
    expect(result.length).toBe(1)
  })
})
