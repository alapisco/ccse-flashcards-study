import { describe, expect, it } from 'vitest'
import { getNextIntelligentQuestion } from '../study/getNextIntelligentQuestion'
import { makeDatasetWithMinimumSimulacro } from './fixtures/makeDataset'

describe('getNextIntelligentQuestion (dynamic avoidRecentCount)', () => {
  it('uses a larger avoidRecentCount for all-scope than for a single tarea', () => {
    const dataset = makeDatasetWithMinimumSimulacro()
    const today = '2025-12-25'

    // All questions are new; selection comes from the "new" bucket.
    // With 25 questions total, dynamic avoidRecentCount = round(25 * 0.4) = 10.
    // If the 10 smallest ids are recent, we should pick the next non-recent.
    const nextAll = getNextIntelligentQuestion({
      dataset,
      progressById: {},
      today,
      constraint: { kind: 'all' },
      recentIds: ['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008', '1009', '1010'],
    })
    expect(nextAll).toBe('2001')

    // For tarea 1 there are 10 questions; dynamic avoidRecentCount = round(10 * 0.4) = 4.
    const nextTarea1 = getNextIntelligentQuestion({
      dataset,
      progressById: {},
      today,
      constraint: { kind: 'tarea', tareaId: 1 },
      // recentIds are tracked oldest -> newest; the algorithm avoids the LAST N.
      // For tarea 1, dynamic avoidRecentCount = 4, so make the last 4 be 1001-1004.
      recentIds: ['1005', '1006', '1007', '1008', '1009', '1010', '1001', '1002', '1003', '1004'],
    })
    expect(nextTarea1).toBe('1005')
  })

  it('respects explicit avoidRecentCount overrides', () => {
    const dataset = makeDatasetWithMinimumSimulacro()
    const today = '2025-12-25'

    const next = getNextIntelligentQuestion({
      dataset,
      progressById: {},
      today,
      constraint: { kind: 'tarea', tareaId: 1 },
      // Only the last 2 are avoided.
      recentIds: ['1003', '1004', '1001', '1002'],
      avoidRecentCount: 2,
    })

    // Only last 2 recent ids are avoided => 1003 is allowed.
    expect(next).toBe('1003')
  })
})
