import type { Dataset } from './types'
import type { ProgressById } from './progress'
import { getQuestionStatus } from './status'

export type UserLevel = 'Principiante' | 'Intermedio' | 'Avanzado' | 'Listo'

export function computeMasteredCount(args: {
  dataset: Dataset
  progressById: ProgressById
  today: string
}): number {
  const { dataset, progressById, today } = args

  let mastered = 0
  for (const q of dataset.questions) {
    if (getQuestionStatus(q, dataset, progressById, today) === 'mastered') mastered += 1
  }
  return mastered
}

export function computeLevel(args: {
  dataset: Dataset
  progressById: ProgressById
  today: string
}): { level: UserLevel; subtitle: string } {
  const { dataset, progressById, today } = args
  const total = dataset.questions.length
  const seen = Object.keys(progressById).length
  const mastered = computeMasteredCount({ dataset, progressById, today })

  const coverage = total === 0 ? 0 : seen / total
  const mastery = total === 0 ? 0 : mastered / total

  let level: UserLevel
  if (coverage < 0.15) level = 'Principiante'
  else if (mastery < 0.35) level = 'Intermedio'
  else if (mastery < 0.7) level = 'Avanzado'
  else level = 'Listo'

  const subtitle =
    level === 'Principiante'
      ? 'Estás empezando. Lo importante es la constancia.'
      : level === 'Intermedio'
        ? 'Vas bien. Mantén los repasos al día para avanzar.'
        : level === 'Avanzado'
          ? 'Estás cerca. Refuerza fallos y haz algún simulacro.'
          : 'Muy bien. Mantén repasos hasta el examen.'

  // ensure today is used to keep signature stable (future: recent accuracy)
  void today

  return { level, subtitle }
}
