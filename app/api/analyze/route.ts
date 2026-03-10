import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { AiAnalysisResult, ServiceCategory } from '@/types'

// Constrained prompt: returns structured JSON only, no pricing or dangerous claims
const SYSTEM_PROMPT = `You are a field service analysis assistant for pest control and lawn care companies.
A technician has submitted one or more photos taken during a customer visit.
Your job is to analyze the images and identify any visible issues that suggest a potential upsell or new service opportunity.

Focus ONLY on:
- Pest activity (ants, cockroaches, rodents, bed bugs, mosquitoes, termites, etc.)
- Lawn or plant issues (weeds, disease, bare patches, overgrowth)
- Harborage conditions (clutter, moisture, wood contact, entry points)
- Sanitation issues that could attract pests
- Structural vulnerabilities (gaps, cracks, damaged wood)

RULES:
- Do NOT invent pricing or make cost guarantees
- Do NOT state dangerous identifications with false certainty when image is unclear
- Keep short_summary under 50 words
- Return ONLY valid JSON, no markdown, no extra text

Return this exact JSON structure:
{
  "issue_detected": "brief description of what you see, or 'Unclear from images'",
  "suggested_service_category": "one of: General Pest Control Upgrade, Termite Opportunity, Rodent Opportunity, Mosquito Opportunity, Bed Bug Opportunity, Cockroach Opportunity, Weed Control Opportunity, Lawn Care Opportunity, Inspection Recommended, Other",
  "confidence": "high, medium, or low",
  "short_summary": "under 50 words, practical recommendation",
  "priority": "high, normal, or low"
}`

const VALID_CATEGORIES: ServiceCategory[] = [
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

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { images?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { images } = body

  if (!images || !Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: 'At least one image is required' }, { status: 400 })
  }

  if (images.length > 5) {
    return NextResponse.json({ error: 'Maximum 5 images allowed' }, { status: 400 })
  }

  // If no OpenAI key, return a mock response (development mode)
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[analyze] OPENAI_API_KEY not set — returning mock response')
    const mockResult: AiAnalysisResult = {
      issue_detected: 'Mock: Visible pest activity detected in submitted images',
      suggested_service_category: 'Inspection Recommended',
      confidence: 'low',
      short_summary:
        'AI analysis is not configured. Set OPENAI_API_KEY to enable real analysis. A manual inspection is recommended.',
      priority: 'normal',
    }
    return NextResponse.json(mockResult)
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    // Build vision message with all images
    const imageContents = images.map((base64) => ({
      type: 'image_url' as const,
      image_url: {
        url: `data:image/jpeg;base64,${base64}`,
        detail: 'low' as const, // 'low' is faster and cheaper for field analysis
      },
    }))

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 300,
      temperature: 0.2, // Low temperature for consistent structured output
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze these ${images.length} field photo(s) and return the JSON analysis.`,
            },
            ...imageContents,
          ],
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) throw new Error('Empty response from AI')

    // Parse and validate the response
    let parsed: AiAnalysisResult
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Try to extract JSON from the response if wrapped in markdown
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Invalid JSON from AI')
      parsed = JSON.parse(match[0])
    }

    // Sanitize/validate the response
    const result: AiAnalysisResult = {
      issue_detected: String(parsed.issue_detected || 'Unclear from images').slice(0, 500),
      suggested_service_category: VALID_CATEGORIES.includes(parsed.suggested_service_category)
        ? parsed.suggested_service_category
        : 'Inspection Recommended',
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence)
        ? parsed.confidence
        : 'low',
      short_summary: String(parsed.short_summary || 'Unable to determine. Manual inspection recommended.').slice(0, 300),
      priority: ['high', 'normal', 'low'].includes(parsed.priority)
        ? parsed.priority
        : 'normal',
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[analyze] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
