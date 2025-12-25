import { describe, expect, it } from 'vitest'
import { buildSimulacro } from '../simulacro/buildSimulacro'
import type { ProgressById } from '../domain/progress'
import { makeDatasetWithMinimumSimulacro, tareaCounts } from './fixtures/makeDataset'
import { SIMULACRO_DISTRIBUTION } from '../domain/types'

describe('buildSimulacro', () => {
  it('builds exactly 25 questions with official distribution', () => {
    const dataset = makeDatasetWithMinimumSimulacro()
    const progressById: ProgressById = {}

    const rng = (() => {
      let x = 42
      return () => {
        // cheap deterministic RNG
        x = (x * 1664525 + 1013904223) % 2 ** 32
        return x / 2 ** 32
      }
    })()

    const built = buildSimulacro({ dataset, progressById, today: '2025-12-23', type: 'oficial', rng })
    expect(built.ids).toHaveLength(25)

    const counts = tareaCounts(built.ids)
    expect(counts).toEqual(SIMULACRO_DISTRIBUTION)

    // no repeats
    expect(new Set(built.ids).size).toBe(25)
  })
})
