/**
 * Tests for AI analysis API route logic.
 * We test the validation/sanitization layer without calling OpenAI.
 */

import { distanceMiles } from '@/lib/utils'

// Mock response validation — mirrors what the route does
function sanitizeAiResult(raw: Record<string, unknown>) {
  const VALID_CATEGORIES = [
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

  return {
    issue_detected: String(raw.issue_detected || 'Unclear from images').slice(0, 500),
    suggested_service_category: VALID_CATEGORIES.includes(raw.suggested_service_category as string)
      ? raw.suggested_service_category
      : 'Inspection Recommended',
    confidence: ['high', 'medium', 'low'].includes(raw.confidence as string)
      ? raw.confidence
      : 'low',
    short_summary: String(raw.short_summary || 'Manual inspection recommended.').slice(0, 300),
    priority: ['high', 'normal', 'low'].includes(raw.priority as string)
      ? raw.priority
      : 'normal',
  }
}

describe('AI result sanitization', () => {
  it('passes through valid result unchanged', () => {
    const input = {
      issue_detected: 'Rodent droppings near garage door',
      suggested_service_category: 'Rodent Opportunity',
      confidence: 'high',
      short_summary: 'Rodent activity detected.',
      priority: 'high',
    }
    const result = sanitizeAiResult(input)
    expect(result.suggested_service_category).toBe('Rodent Opportunity')
    expect(result.confidence).toBe('high')
    expect(result.priority).toBe('high')
  })

  it('falls back to Inspection Recommended for invalid category', () => {
    const input = {
      issue_detected: 'Something',
      suggested_service_category: 'INVALID_CATEGORY',
      confidence: 'high',
      short_summary: 'Some summary',
      priority: 'normal',
    }
    const result = sanitizeAiResult(input)
    expect(result.suggested_service_category).toBe('Inspection Recommended')
  })

  it('falls back to low confidence for invalid confidence value', () => {
    const input = {
      issue_detected: 'Something',
      suggested_service_category: 'Rodent Opportunity',
      confidence: 'very_high_confidence',
      short_summary: 'Some summary',
      priority: 'normal',
    }
    const result = sanitizeAiResult(input)
    expect(result.confidence).toBe('low')
  })

  it('falls back to normal priority for invalid priority value', () => {
    const input = {
      issue_detected: 'Something',
      suggested_service_category: 'Inspection Recommended',
      confidence: 'low',
      short_summary: 'Some summary',
      priority: 'critical',
    }
    const result = sanitizeAiResult(input)
    expect(result.priority).toBe('normal')
  })

  it('truncates excessively long issue_detected', () => {
    const input = {
      issue_detected: 'x'.repeat(1000),
      suggested_service_category: 'Other',
      confidence: 'low',
      short_summary: 'Summary',
      priority: 'normal',
    }
    const result = sanitizeAiResult(input)
    expect(result.issue_detected.length).toBeLessThanOrEqual(500)
  })

  it('handles missing fields gracefully', () => {
    const result = sanitizeAiResult({})
    expect(result.issue_detected).toBe('Unclear from images')
    expect(result.suggested_service_category).toBe('Inspection Recommended')
    expect(result.confidence).toBe('low')
    expect(result.priority).toBe('normal')
  })
})

describe('distanceMiles utility', () => {
  it('returns 0 for same coordinates', () => {
    expect(distanceMiles(33.45, -112.07, 33.45, -112.07)).toBeCloseTo(0)
  })

  it('calculates reasonable distance between Phoenix and Scottsdale', () => {
    // Phoenix downtown: 33.4484, -112.0740
    // Scottsdale: 33.4942, -111.9261
    const miles = distanceMiles(33.4484, -112.074, 33.4942, -111.9261)
    // Should be roughly 8-10 miles
    expect(miles).toBeGreaterThan(7)
    expect(miles).toBeLessThan(12)
  })

  it('handles transatlantic distances', () => {
    // New York to London
    const miles = distanceMiles(40.7128, -74.006, 51.5074, -0.1278)
    expect(miles).toBeGreaterThan(3000)
    expect(miles).toBeLessThan(4000)
  })
})
