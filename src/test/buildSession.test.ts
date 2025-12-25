import { describe, expect, it } from 'vitest'
import { buildStudySession } from '../study/buildSession'
import type { ProgressById } from '../domain/progress'
import { createEmptyCard } from 'ts-fsrs'
import { makeDatasetWithMinimumSimulacro } from './fixtures/makeDataset'

function progressWithDue(today: string): ProgressById[string] {
  const card = createEmptyCard(new Date())
  card.due = new Date(today + 'T00:00:00')
  card.scheduled_days = 1
  return {
    card,
    nextReviewAt: today,
    seenCount: 1,
    correctCount: 1,
    wrongCount: 0,
    leechScore: 0,
    // Not seen today yet; should be counted as due.
    lastSeenAt: undefined,
  }
}

describe('buildStudySession', () => {
  it('treats due as sacred when onlyThisTarea is OFF', () => {
    const dataset = makeDatasetWithMinimumSimulacro()
    const today = '2025-12-23'

    const progressById: ProgressById = {}
    // Mark some due items in tarea 1 and tarea 5
    progressById['1001'] = progressWithDue(today)
    progressById['5001'] = progressWithDue(today)

    const built = buildStudySession({
      dataset,
      progressById,
      today,
      size: 10,
      focusTareaId: 1,
      onlyThisTarea: false,
    })

    // should include both due items regardless of focus task
    expect(built.ids).toContain('1001')
    expect(built.ids).toContain('5001')
  })

  it('restricts everything to the selected task when onlyThisTarea is ON', () => {
    const dataset = makeDatasetWithMinimumSimulacro()
    const today = '2025-12-23'

    const progressById: ProgressById = {}
    progressById['5001'] = progressWithDue(today)

    const built = buildStudySession({
      dataset,
      progressById,
      today,
      size: 10,
      focusTareaId: 1,
      onlyThisTarea: true,
    })

    expect(built.ids.some((id) => id.startsWith('5'))).toBe(false)
  })
})
