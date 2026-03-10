'use client'

import { useEffect, useState } from 'react'
import { AiAnalysisResult, PhotoFile, ServiceCategory } from '@/types'
import { SERVICE_CATEGORIES, fileToBase64 } from '@/lib/utils'
import { NewOpportunityState } from '@/types'

interface Props {
  photos: PhotoFile[]
  aiResult: AiAnalysisResult | null
  editedIssue: string
  editedCategory: ServiceCategory | null
  editedSummary: string
  technicianNotes: string
  customerMentionedIssue: boolean
  highPriority: boolean
  onUpdate: (updates: Partial<NewOpportunityState>) => void
  onAiResult: (result: AiAnalysisResult) => void
  onNext: () => void
  onBack: () => void
}

type AnalyzeStatus = 'idle' | 'loading' | 'done' | 'error'

export default function StepAiSummary({
  photos,
  aiResult,
  editedIssue,
  editedCategory,
  editedSummary,
  technicianNotes,
  customerMentionedIssue,
  highPriority,
  onUpdate,
  onAiResult,
  onNext,
  onBack,
}: Props) {
  const [analyzeStatus, setAnalyzeStatus] = useState<AnalyzeStatus>(
    aiResult ? 'done' : 'idle'
  )
  const [analyzeError, setAnalyzeError] = useState('')

  // Auto-analyze on mount if no result yet
  useEffect(() => {
    if (!aiResult && photos.length > 0) {
      analyzePhotos()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function analyzePhotos() {
    setAnalyzeStatus('loading')
    setAnalyzeError('')

    try {
      const base64Images = await Promise.all(
        photos.slice(0, 4).map((p) => fileToBase64(p.file))
      )

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: base64Images }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Analysis failed' }))
        throw new Error(err.error || 'Analysis failed')
      }

      const result: AiAnalysisResult = await res.json()
      onAiResult(result)
      setAnalyzeStatus('done')
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis failed')
      setAnalyzeStatus('error')
    }
  }

  const confidenceColors = {
    high: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-gray-500 bg-gray-50',
  }

  return (
    <div className="space-y-5">
      {/* Loading */}
      {analyzeStatus === 'loading' && (
        <div className="card text-center py-10">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
          <p className="font-medium text-gray-700">Analyzing photos...</p>
          <p className="text-sm text-gray-400 mt-1">This takes a few seconds</p>
        </div>
      )}

      {/* Error */}
      {analyzeStatus === 'error' && (
        <div className="card">
          <div className="text-center mb-4">
            <p className="text-3xl mb-2">⚠️</p>
            <p className="font-medium text-gray-700">Analysis failed</p>
            <p className="text-sm text-red-500 mt-1">{analyzeError}</p>
          </div>
          <button onClick={analyzePhotos} className="btn-secondary">
            Try Again
          </button>
        </div>
      )}

      {/* Results — editable form */}
      {analyzeStatus === 'done' && aiResult && (
        <>
          {/* AI Confidence indicator */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">AI Analysis</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${confidenceColors[aiResult.confidence]}`}>
              {aiResult.confidence} confidence
            </span>
          </div>

          {/* Detected Issue */}
          <div>
            <label className="label">Issue Detected</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={editedIssue}
              onChange={(e) => onUpdate({ editedIssue: e.target.value })}
              placeholder="Describe the issue..."
            />
          </div>

          {/* Service Category */}
          <div>
            <label className="label">Service Category</label>
            <select
              className="input"
              value={editedCategory ?? ''}
              onChange={(e) => onUpdate({ editedCategory: e.target.value as ServiceCategory })}
            >
              <option value="" disabled>Select category...</option>
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* AI Summary */}
          <div>
            <label className="label">Summary</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={editedSummary}
              onChange={(e) => onUpdate({ editedSummary: e.target.value })}
              placeholder="Service recommendation summary..."
            />
          </div>

          {/* Technician Notes */}
          <div>
            <label className="label">Your Notes (optional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              value={technicianNotes}
              onChange={(e) => onUpdate({ technicianNotes: e.target.value })}
              placeholder="Add anything the AI missed..."
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <CheckboxField
              id="customer-mentioned"
              label="Customer mentioned this issue"
              checked={customerMentionedIssue}
              onChange={(v) => onUpdate({ customerMentionedIssue: v })}
            />
            <CheckboxField
              id="high-priority"
              label="Mark as high priority"
              checked={highPriority}
              onChange={(v) => onUpdate({ highPriority: v })}
            />
          </div>

          <button onClick={analyzePhotos} className="btn-secondary text-sm py-3">
            Re-analyze Photos
          </button>
        </>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="btn-secondary flex-none w-auto px-5">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={analyzeStatus === 'loading' || (!aiResult && analyzeStatus !== 'done')}
          className="btn-primary flex-1"
        >
          Select Site
        </button>
      </div>
    </div>
  )
}

function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
            checked ? 'bg-brand-600 border-brand-600' : 'border-gray-300 bg-white'
          }`}
        >
          {checked && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}
