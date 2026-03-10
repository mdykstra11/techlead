'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NewOpportunityState, ServiceCategory } from '@/types'
import { CATEGORY_ICONS } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Props {
  state: NewOpportunityState
  onBack: () => void
  onEditedCategoryChange: (cat: ServiceCategory) => void
}

export default function StepReview({ state, onBack }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit() {
    setSubmitting(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Upload photos
      const uploadedPhotos: { photo_url: string; storage_path: string }[] = []

      for (const photo of state.photos) {
        const path = `${user.id}/${Date.now()}-${photo.file.name}`
        const { error: uploadError } = await supabase.storage
          .from('opportunity-photos')
          .upload(path, photo.file, { contentType: 'image/jpeg', upsert: false })

        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`)

        const { data: urlData } = supabase.storage
          .from('opportunity-photos')
          .getPublicUrl(path)

        uploadedPhotos.push({
          photo_url: urlData.publicUrl,
          storage_path: path,
        })
      }

      // 2. Create opportunity
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_site_id: state.selectedSite!.id,
          issue_detected: state.editedIssue,
          suggested_service_category: state.editedCategory,
          ai_confidence: state.aiResult?.confidence ?? null,
          ai_summary: state.editedSummary,
          technician_notes: state.technicianNotes,
          customer_mentioned_issue: state.customerMentionedIssue,
          high_priority: state.highPriority,
          photos: uploadedPhotos,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Submission failed' }))
        throw new Error(err.error || 'Submission failed')
      }

      const { id } = await res.json()
      router.push(`/opportunities/${id}?submitted=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
      setSubmitting(false)
    }
  }

  const { selectedSite, photos, editedIssue, editedCategory, editedSummary, technicianNotes, highPriority, customerMentionedIssue } = state

  return (
    <div className="space-y-5">
      <p className="text-gray-500 text-sm">Review before submitting.</p>

      {/* Photos */}
      <div>
        <p className="label">Photos ({photos.length})</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.id}
              src={p.preview}
              alt=""
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
          ))}
        </div>
      </div>

      {/* Site */}
      <div className="card">
        <p className="label">Customer Site</p>
        <p className="font-semibold text-gray-900">{selectedSite?.customer_name}</p>
        <p className="text-sm text-gray-500">
          {selectedSite?.address_1}, {selectedSite?.city}, {selectedSite?.state}
        </p>
        {selectedSite?.location_number && (
          <p className="text-xs text-gray-400 mt-0.5">#{selectedSite.location_number}</p>
        )}
      </div>

      {/* AI Summary */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {CATEGORY_ICONS[editedCategory as ServiceCategory] ?? '📋'}
          </span>
          <div>
            <p className="font-semibold text-gray-900">{editedCategory ?? 'No category'}</p>
            {highPriority && (
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                High Priority
              </span>
            )}
          </div>
        </div>

        {editedIssue && (
          <div>
            <p className="label">Issue Detected</p>
            <p className="text-sm text-gray-700">{editedIssue}</p>
          </div>
        )}

        {editedSummary && (
          <div>
            <p className="label">Summary</p>
            <p className="text-sm text-gray-700">{editedSummary}</p>
          </div>
        )}

        {technicianNotes && (
          <div>
            <p className="label">Your Notes</p>
            <p className="text-sm text-gray-700">{technicianNotes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {customerMentionedIssue && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              Customer mentioned
            </span>
          )}
          {highPriority && (
            <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">
              High priority
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={submitting}
          className="btn-secondary flex-none w-auto px-5"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary flex-1"
        >
          {submitting ? (
            <>
              <Spinner />
              Submitting...
            </>
          ) : (
            <>
              <SendIcon />
              Submit Opportunity
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  )
}
