/**
 * Tests for utility functions
 */

import { formatDate, formatDistance, cn, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'

describe('cn (class name utility)', () => {
  it('joins class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('filters out falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })
})

describe('formatDate', () => {
  it('returns a readable date string', () => {
    const result = formatDate('2024-01-15T10:00:00Z')
    expect(result).toContain('Jan')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })
})

describe('formatDistance', () => {
  it('returns "Nearby" for very close distances', () => {
    expect(formatDistance(0.05)).toBe('Nearby')
  })

  it('returns feet for sub-mile distances', () => {
    expect(formatDistance(0.5)).toContain('ft')
  })

  it('returns miles for longer distances', () => {
    expect(formatDistance(1.5)).toBe('1.5 mi')
  })

  it('rounds to one decimal', () => {
    expect(formatDistance(2.678)).toBe('2.7 mi')
  })
})

describe('STATUS_LABELS', () => {
  it('has labels for all statuses', () => {
    const statuses = ['submitted', 'reviewed', 'contacted', 'quoted', 'won', 'lost']
    statuses.forEach((s) => {
      expect(STATUS_LABELS[s as keyof typeof STATUS_LABELS]).toBeTruthy()
    })
  })
})

describe('STATUS_COLORS', () => {
  it('has color classes for all statuses', () => {
    const statuses = ['submitted', 'reviewed', 'contacted', 'quoted', 'won', 'lost']
    statuses.forEach((s) => {
      expect(STATUS_COLORS[s as keyof typeof STATUS_COLORS]).toBeTruthy()
    })
  })
})
