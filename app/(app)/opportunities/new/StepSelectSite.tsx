'use client'

import { useEffect, useState, useCallback } from 'react'
import { CustomerSite } from '@/types'
import { formatDistance } from '@/lib/utils'

interface Props {
  selectedSite: CustomerSite | null
  onSiteSelect: (site: CustomerSite) => void
  onNext: () => void
  onBack: () => void
}

type LocationStatus = 'requesting' | 'granted' | 'denied' | 'unsupported'

export default function StepSelectSite({ selectedSite, onSiteSelect, onNext, onBack }: Props) {
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('requesting')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [sites, setSites] = useState<CustomerSite[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')

  // Request GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported')
      fetchSites(null, '')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(c)
        setLocationStatus('granted')
        fetchSites(c, '')
      },
      () => {
        setLocationStatus('denied')
        fetchSites(null, '')
      },
      { timeout: 8000, maximumAge: 60000 }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSites(coords, searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const fetchSites = useCallback(
    async (location: { lat: number; lng: number } | null, query: string) => {
      setLoading(true)
      setError('')
      try {
        const params = new URLSearchParams()
        if (location) {
          params.set('lat', location.lat.toString())
          params.set('lng', location.lng.toString())
        }
        if (query) params.set('q', query)

        const res = await fetch(`/api/sites?${params}`)
        if (!res.ok) throw new Error('Failed to load sites')
        const data = await res.json()
        setSites(data.sites)
      } catch {
        setError('Could not load customer sites')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return (
    <div className="space-y-4">
      {/* Location status */}
      {locationStatus === 'denied' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
          Location access denied. Showing all sites — search to find yours.
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          className="input pl-9"
          placeholder="Search by name, address, or location #"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Selected site display */}
      {selectedSite && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-brand-800 text-sm">Selected:</p>
              <p className="text-brand-900 font-medium">{selectedSite.customer_name}</p>
              <p className="text-brand-700 text-xs">
                {selectedSite.address_1}, {selectedSite.city}
              </p>
            </div>
            <CheckCircleIcon className="w-6 h-6 text-brand-600 flex-shrink-0" />
          </div>
        </div>
      )}

      {/* Sites list */}
      {error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}

      {loading && !sites.length ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sites.length === 0 && !loading && (
            <p className="text-center text-sm text-gray-400 py-6">No sites found.</p>
          )}
          {sites.map((site) => (
            <button
              key={site.id}
              onClick={() => onSiteSelect(site)}
              className={`w-full text-left rounded-xl border p-3 transition-colors ${
                selectedSite?.id === site.id
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 bg-white active:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {site.customer_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {site.address_1}, {site.city}, {site.state}
                  </p>
                  {site.location_number && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      #{site.location_number}
                    </p>
                  )}
                </div>
                <div className="ml-3 text-right flex-shrink-0">
                  {site.distance_miles !== undefined && (
                    <p className="text-xs text-gray-400">
                      {formatDistance(site.distance_miles)}
                    </p>
                  )}
                  {selectedSite?.id === site.id && (
                    <CheckCircleIcon className="w-5 h-5 text-brand-600 mt-1 ml-auto" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="btn-secondary flex-none w-auto px-5">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selectedSite}
          className="btn-primary flex-1"
        >
          Review & Submit
        </button>
      </div>
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
