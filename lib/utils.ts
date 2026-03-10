import { OpportunityStatus, ServiceCategory } from '@/types'

// Simple cn utility — joins class strings, skips falsy values
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ').trim()
}

// Haversine formula: distance between two lat/lng points in miles
export function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return 'Nearby'
  if (miles < 1) return `${(miles * 5280).toFixed(0)} ft`
  return `${miles.toFixed(1)} mi`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  contacted: 'Contacted',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost',
}

export const STATUS_COLORS: Record<OpportunityStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-purple-100 text-purple-800',
  quoted: 'bg-orange-100 text-orange-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-gray-100 text-gray-700',
}

export const CATEGORY_ICONS: Record<ServiceCategory, string> = {
  'General Pest Control Upgrade': '🐛',
  'Termite Opportunity': '🪲',
  'Rodent Opportunity': '🐭',
  'Mosquito Opportunity': '🦟',
  'Bed Bug Opportunity': '🛏️',
  'Cockroach Opportunity': '🪳',
  'Weed Control Opportunity': '🌿',
  'Lawn Care Opportunity': '🌱',
  'Inspection Recommended': '🔍',
  'Other': '📋',
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'General Pest Control Upgrade',
  'Termite Opportunity',
  'Rodent Opportunity',
  'Mosquito Opportunity',
  'Bed Bug Opportunity',
  'Cockroach Opportunity',
  'Weed Control Opportunity',
  'Lawn Care Opportunity',
  'Inspection Recommended',
  'Other',
]

// Compress image before upload (reduces file size for mobile photos)
export async function compressImage(
  file: File,
  maxWidthPx = 1200,
  qualityJpeg = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidthPx) {
        height = Math.round((height * maxWidthPx) / width)
        width = maxWidthPx
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (blob) resolve(blob)
          else reject(new Error('Canvas to blob failed'))
        },
        'image/jpeg',
        qualityJpeg
      )
    }
    img.onerror = reject
    img.src = url
  })
}

// Convert File to base64 for AI analysis
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
