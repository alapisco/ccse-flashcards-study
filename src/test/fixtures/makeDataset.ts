import type { Dataset, TareaId } from '../../domain/types'
import { SIMULACRO_DISTRIBUTION, TAREA_IDS } from '../../domain/types'

export function makeDatasetWithMinimumSimulacro(): Dataset {
  const tareas = [
    { id: 1 as const, name: 'Tarea 1' },
    { id: 2 as const, name: 'Tarea 2' },
    { id: 3 as const, name: 'Tarea 3' },
    { id: 4 as const, name: 'Tarea 4' },
    { id: 5 as const, name: 'Tarea 5' },
  ]

  const questions = TAREA_IDS.flatMap((tareaId) => {
    const count = SIMULACRO_DISTRIBUTION[tareaId]
    return Array.from({ length: count }, (_, i) => ({
      id: `${tareaId}${String(i + 1).padStart(3, '0')}`,
      tareaId,
      question: `Q ${tareaId}-${i + 1}`,
      options:
        tareaId === 2
          ? [
              { letter: 'a', text: 'Verdadero' },
              { letter: 'b', text: 'Falso' },
            ]
          : [
              { letter: 'a', text: 'A' },
              { letter: 'b', text: 'B' },
              { letter: 'c', text: 'C' },
              { letter: 'd', text: 'D' },
            ],
      answer: 'a',
    }))
  })

  return {
    datasetVersion: 'ccse-2-26',
    tareas,
    questions,
  }
}

export function tareaCounts(ids: string[]): Record<TareaId, number> {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<TareaId, number>
  for (const id of ids) {
    const tareaId = Number(id[0]) as TareaId
    counts[tareaId] += 1
  }
  return counts
}
