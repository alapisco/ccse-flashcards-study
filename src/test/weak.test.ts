import { describe, expect, it } from 'vitest'
import { applyLeechDelta, isWeak } from '../domain/weak'
import type { QuestionProgress } from '../domain/progress'
import { createEmptyCard } from 'ts-fsrs'

describe('weak/leech logic', () => {
  it('applies leech score deltas', () => {
    expect(applyLeechDelta(0, 'wrong')).toBe(2)
    expect(applyLeechDelta(2, 'guessed')).toBe(3)
    expect(applyLeechDelta(1, 'knew')).toBe(0)
    expect(applyLeechDelta(0, 'knew')).toBe(0)
  })

  it('marks as weak for wrongCount, leechScore, guessed, or manual flag', () => {
    const base: QuestionProgress = {
      card: createEmptyCard(new Date()),
      nextReviewAt: '2099-01-01',
      seenCount: 1,
      correctCount: 0,
      wrongCount: 0,
      leechScore: 0,
    }

    expect(isWeak({ ...base, wrongCount: 3 }, '2025-12-23')).toBe(true)
    expect(isWeak({ ...base, leechScore: 4 }, '2025-12-23')).toBe(true)
    expect(isWeak({ ...base, lastResult: 'guessed' }, '2025-12-23')).toBe(true)
    expect(isWeak({ ...base, manualWeak: true }, '2025-12-23')).toBe(true)

    expect(isWeak({ ...base, wrongCount: 0, leechScore: 0, lastResult: 'knew' }, '2025-12-23')).toBe(false)
  })
})
