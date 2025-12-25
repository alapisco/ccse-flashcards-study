import { describe, expect, it } from 'vitest'
import { getNextIntelligentQuestion } from '../study/getNextIntelligentQuestion'
import { makeDatasetWithMinimumSimulacro } from './fixtures/makeDataset'
import { createEmptyCard } from 'ts-fsrs'

describe('getNextIntelligentQuestion (dynamic avoidRecentCount)', () => {
  it('uses a larger avoidRecentCount for all-scope than for a single tarea', () => {
    const dataset = makeDatasetWithMinimumSimulacro()
    const today = '2025-12-25'

    // All questions are new; selection comes from the "new" bucket.
    // With 25 questions total, dynamic avoidRecentCount = round(25 * 0.5) = 13.
    // If the 13 smallest ids are recent, we should pick the next non-recent.
    const nextAll = getNextIntelligentQuestion({
      dataset,
      progressById: {},
      today,
      constraint: { kind: 'all' },
      recentIds: ['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008', '1009', '1010', '2001', '2002', '2003'],
    })
    expect(nextAll).toBe('3001')

    // For tarea 1 there are 10 questions; dynamic avoidRecentCount = max(6, round(10 * 0.5)) = 6.
    const nextTarea1 = getNextIntelligentQuestion({
      dataset,
      progressById: {},
      today,
      constraint: { kind: 'tarea', tareaId: 1 },
      // recentIds are tracked oldest -> newest; the algorithm avoids the LAST N.
      // For tarea 1, dynamic avoidRecentCount = 6, so make the last 6 be 1001-1006.
      recentIds: ['1007', '1008', '1009', '1010', '1001', '1002', '1003', '1004', '1005', '1006'],
    })
    expect(nextTarea1).toBe('1007')
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

  it('does not resurface a card marked as knew today if alternatives exist', () => {
    const dataset = makeDatasetWithMinimumSimulacro()
    const today = '2025-12-25'

    const card = createEmptyCard(new Date())

    const progressById = {
      // In scope (tarea 1) and already answered as "knew" today.
      '1001': {
        card,
        nextReviewAt: '2025-12-30',
        seenCount: 1,
        correctCount: 1,
        wrongCount: 0,
        leechScore: 0,
        lastSeenAt: today,
        lastResult: 'knew',
      },
    }

    const next = getNextIntelligentQuestion({
      dataset,
      progressById,
      today,
      constraint: { kind: 'tarea', tareaId: 1 },
      recentIds: [],
    })

    // Should pick another question from tarea 1 instead of repeating 1001.
    expect(next).toBe('1002')
  })
})
