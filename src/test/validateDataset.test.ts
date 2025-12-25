import { describe, expect, it } from 'vitest'
import { normalizeDataset, validateDataset } from '../domain/validateDataset'
import type { Dataset } from '../domain/types'

describe('validateDataset', () => {
  it('accepts a normalized dataset with consistent answers', () => {
    const ds: Dataset = normalizeDataset({
      datasetVersion: 'ccse-2-26',
      tareas: [
        { id: 1, name: 'T1' },
        { id: 2, name: 'T2' },
        { id: 3, name: 'T3' },
        { id: 4, name: 'T4' },
        { id: 5, name: 'T5' },
      ],
      questions: [
        {
          id: '1001',
          tareaId: 1,
          question: 'Q',
          options: [
            { letter: 'a', text: 'A' },
            { letter: 'b', text: 'B' },
          ],
          answer: 'a',
        },
      ],
    })

    expect(validateDataset(ds)).toEqual([])
    expect(ds.questions[0]?.type).toBe('tf')
  })

  it('detects duplicate IDs and invalid answers', () => {
    const ds: Dataset = {
      datasetVersion: 'ccse-2-26',
      tareas: [
        { id: 1, name: 'T1' },
        { id: 2, name: 'T2' },
        { id: 3, name: 'T3' },
        { id: 4, name: 'T4' },
        { id: 5, name: 'T5' },
      ],
      questions: [
        {
          id: '1001',
          tareaId: 1,
          question: 'Q1',
          options: [
            { letter: 'a', text: 'A' },
            { letter: 'b', text: 'B' },
          ],
          answer: 'c',
        },
        {
          id: '1001',
          tareaId: 1,
          question: 'Q2',
          options: [
            { letter: 'a', text: 'A' },
            { letter: 'b', text: 'B' },
          ],
          answer: 'a',
        },
      ],
    }

    const errors = validateDataset(ds)
    expect(errors.some((e) => e.code === 'duplicate_question_id')).toBe(true)
    expect(errors.some((e) => e.code === 'answer_not_in_options')).toBe(true)
  })
})
