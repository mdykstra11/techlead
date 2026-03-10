'use client'

import { useState } from 'react'
import { NewOpportunityState, PhotoFile, AiAnalysisResult, CustomerSite, ServiceCategory } from '@/types'
import StepPhotos from './StepPhotos'
import StepAiSummary from './StepAiSummary'
import StepSelectSite from './StepSelectSite'
import StepReview from './StepReview'

export type Step = 'photos' | 'ai' | 'site' | 'review'

const STEPS: Step[] = ['photos', 'ai', 'site', 'review']
const STEP_LABELS = ['Photos', 'Summary', 'Site', 'Submit']

const initialState: NewOpportunityState = {
  photos: [],
  aiResult: null,
  editedIssue: '',
  editedCategory: null,
  editedSummary: '',
  technicianNotes: '',
  customerMentionedIssue: false,
  highPriority: false,
  selectedSite: null,
}

export default function NewOpportunityPage() {
  const [step, setStep] = useState<Step>('photos')
  const [state, setState] = useState<NewOpportunityState>(initialState)

  const stepIndex = STEPS.indexOf(step)

  function updateState(updates: Partial<NewOpportunityState>) {
    setState((prev) => ({ ...prev, ...updates }))
  }

  function goNext() {
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next)
  }

  function goBack() {
    const prev = STEPS[stepIndex - 1]
    if (prev) setStep(prev)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">New Opportunity</h1>
          <span className="text-sm text-gray-400">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-brand-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="flex gap-1.5 mt-1">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex-1 text-center">
              <span className={`text-xs ${i === stepIndex ? 'text-brand-600 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      {step === 'photos' && (
        <StepPhotos
          photos={state.photos}
          onPhotosChange={(photos: PhotoFile[]) => updateState({ photos })}
          onNext={goNext}
        />
      )}

      {step === 'ai' && (
        <StepAiSummary
          photos={state.photos}
          aiResult={state.aiResult}
          editedIssue={state.editedIssue}
          editedCategory={state.editedCategory}
          editedSummary={state.editedSummary}
          technicianNotes={state.technicianNotes}
          customerMentionedIssue={state.customerMentionedIssue}
          highPriority={state.highPriority}
          onUpdate={(updates) => updateState(updates)}
          onAiResult={(result: AiAnalysisResult) =>
            updateState({
              aiResult: result,
              editedIssue: result.issue_detected,
              editedCategory: result.suggested_service_category,
              editedSummary: result.short_summary,
              highPriority: result.priority === 'high',
            })
          }
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {step === 'site' && (
        <StepSelectSite
          selectedSite={state.selectedSite}
          onSiteSelect={(site: CustomerSite) => updateState({ selectedSite: site })}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {step === 'review' && (
        <StepReview
          state={state}
          onBack={goBack}
          onEditedCategoryChange={(cat: ServiceCategory) => updateState({ editedCategory: cat })}
        />
      )}
    </div>
  )
}
