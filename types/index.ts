export type UserRole = 'technician' | 'office'

export type OpportunityStatus =
  | 'submitted'
  | 'reviewed'
  | 'contacted'
  | 'quoted'
  | 'won'
  | 'lost'

export type ServiceCategory =
  | 'General Pest Control Upgrade'
  | 'Termite Opportunity'
  | 'Rodent Opportunity'
  | 'Mosquito Opportunity'
  | 'Bed Bug Opportunity'
  | 'Cockroach Opportunity'
  | 'Weed Control Opportunity'
  | 'Lawn Care Opportunity'
  | 'Inspection Recommended'
  | 'Other'

export type AiConfidence = 'high' | 'medium' | 'low'
export type Priority = 'high' | 'normal' | 'low'

export interface Profile {
  id: string
  role: UserRole
  company_id: string | null
  name: string
  email: string
  active: boolean
  created_at: string
}

export interface CustomerSite {
  id: string
  company_id: string | null
  customer_name: string
  location_number: string | null
  address_1: string
  city: string
  state: string
  zip: string
  lat: number
  lng: number
  active: boolean
  created_at: string
  distance_miles?: number
}

export interface Opportunity {
  id: string
  company_id: string | null
  technician_id: string
  customer_site_id: string
  issue_detected: string | null
  suggested_service_category: ServiceCategory | null
  ai_confidence: AiConfidence | null
  ai_summary: string | null
  technician_notes: string | null
  customer_mentioned_issue: boolean
  high_priority: boolean
  status: OpportunityStatus
  office_notes: string | null
  assigned_to: string | null
  estimated_value: number | null
  closed_value: number | null
  created_at: string
  updated_at: string
  // Joins
  profile?: Profile
  customer_site?: CustomerSite
  opportunity_photos?: OpportunityPhoto[]
}

export interface OpportunityPhoto {
  id: string
  opportunity_id: string
  photo_url: string
  storage_path: string
  created_at: string
}

export interface OpportunityStatusHistory {
  id: string
  opportunity_id: string
  old_status: OpportunityStatus | null
  new_status: OpportunityStatus
  changed_by: string
  created_at: string
  profile?: Profile
}

export interface AiAnalysisResult {
  issue_detected: string
  suggested_service_category: ServiceCategory
  confidence: AiConfidence
  short_summary: string
  priority: Priority
}

// For the new opportunity form state
export interface NewOpportunityState {
  photos: PhotoFile[]
  aiResult: AiAnalysisResult | null
  editedIssue: string
  editedCategory: ServiceCategory | null
  editedSummary: string
  technicianNotes: string
  customerMentionedIssue: boolean
  highPriority: boolean
  selectedSite: CustomerSite | null
}

export interface PhotoFile {
  id: string
  file: File
  preview: string
  uploading?: boolean
  uploadedUrl?: string
  storagePath?: string
}
