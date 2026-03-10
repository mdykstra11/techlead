'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OpportunityStatus } from '@/types'
import { STATUS_LABELS } from '@/lib/utils'

interface Props {
  opportunityId: string
  currentStatus: OpportunityStatus
  currentOfficeNotes: string
  currentAssignedTo: string
  currentEstimatedValue: number | null
  currentClosedValue: number | null
}

const ALL_STATUSES: OpportunityStatus[] = [
  'submitted', 'reviewed', 'contacted', 'quoted', 'won', 'lost',
]

export default function OfficeEditForm({
  opportunityId,
  currentStatus,
  currentOfficeNotes,
  currentAssignedTo,
  currentEstimatedValue,
  currentClosedValue,
}: Props) {
  const [status, setStatus] = useState<OpportunityStatus>(currentStatus)
  const [officeNotes, setOfficeNotes] = useState(currentOfficeNotes)
  const [assignedTo, setAssignedTo] = useState(currentAssignedTo)
  const [estimatedValue, setEstimatedValue] = useState(
    currentEstimatedValue?.toString() ?? ''
  )
  const [closedValue, setClosedValue] = useState(
    currentClosedValue?.toString() ?? ''
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')

    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          office_notes: officeNotes,
          assigned_to: assignedTo,
          estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
          closed_value: closedValue ? parseFloat(closedValue) : null,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Save failed' }))
        throw new Error(err.error || 'Save failed')
      }

      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-gray-900">Office Actions</h2>

      {/* Status */}
      <div>
        <label className="label">Status</label>
        <div className="grid grid-cols-3 gap-2">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${
                status === s
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 active:bg-gray-50'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Assigned To */}
      <div>
        <label className="label">Assigned To</label>
        <input
          type="text"
          className="input"
          placeholder="Salesperson name..."
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        />
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Est. Value ($)</label>
          <input
            type="number"
            className="input"
            placeholder="0.00"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Closed Value ($)</label>
          <input
            type="number"
            className="input"
            placeholder="0.00"
            value={closedValue}
            onChange={(e) => setClosedValue(e.target.value)}
          />
        </div>
      </div>

      {/* Office Notes */}
      <div>
        <label className="label">Office Notes</label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Internal notes for the team..."
          value={officeNotes}
          onChange={(e) => setOfficeNotes(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {saved && (
        <p className="text-sm text-green-600 font-medium">✓ Saved successfully</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
