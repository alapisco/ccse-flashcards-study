import type { Dataset, Question, TareaId } from '../domain/types'
import type { ProgressById } from '../domain/progress'
import { isWeak } from '../domain/weak'
import { isDue } from '../domain/status'

export type StudyPreset = 'short' | 'medium' | 'long'

export const PRESET_SIZES: Record<StudyPreset, number> = {
  short: 10,
  medium: 25,
  long: 40,
}

export type StudySessionPoolLabel = 'due' | 'weak' | 'new'

export type BuiltStudySession = {
  ids: string[]
  breakdown: Record<StudySessionPoolLabel, number>
}

function pickIds(source: Question[], count: number): string[] {
  const ids: string[] = []
  for (let i = 0; i < source.length && ids.length < count; i++) {
    ids.push(source[i]!.id)
  }
  return ids
}

function shuffleDeterministic(items: Question[]): Question[] {
  // v1: deterministic shuffle not required. Keep stable ordering by id.
  return [...items].sort((a, b) => a.id.localeCompare(b.id))
}

export function buildStudySession(args: {
  dataset: Dataset
  progressById: ProgressById
  today: string
  size: number
  focusTareaId: TareaId | 'all'
  onlyThisTarea: boolean
}): BuiltStudySession {
  const { dataset, progressById, today, size, focusTareaId, onlyThisTarea } = args

  const inScope = (q: Question) => {
    if (focusTareaId === 'all') return true
    return q.tareaId === focusTareaId
  }

  const duePool = dataset.questions.filter((q) => {
    const p = progressById[q.id]
    if (!p) return false
    return (!onlyThisTarea || inScope(q)) && isDue(p.nextReviewAt, today)
  })

  const weakPool = dataset.questions.filter((q) => {
    if (!progressById[q.id]) return false
    if (onlyThisTarea && !inScope(q)) return false
    const p = progressById[q.id]
    if (!p) return false
    if (isDue(p.nextReviewAt, today)) return false
    return isWeak(p, today)
  })

  const newPool = dataset.questions.filter((q) => {
    if (onlyThisTarea && !inScope(q)) return false
    return !progressById[q.id]
  })

  const due = shuffleDeterministic(duePool)
  const weak = shuffleDeterministic(weakPool)
  const newly = shuffleDeterministic(newPool)

  const targetDue = Math.round(size * 0.6)
  const targetWeak = Math.round(size * 0.25)
  const targetNew = size - targetDue - targetWeak

  const pickedDue = pickIds(due, targetDue)
  const pickedWeak = pickIds(weak, targetWeak)
  const pickedNew = pickIds(newly, targetNew)

  const ids = [...pickedDue, ...pickedWeak, ...pickedNew]

  const remaining = size - ids.length
  if (remaining > 0) {
    const already = new Set(ids)
    const backfill = [...weak, ...due, ...newly]
      .filter((q) => !already.has(q.id))
      .map((q) => q.id)
    ids.push(...backfill.slice(0, remaining))
  }

  const byId = new Map<string, Question>(dataset.questions.map((q) => [q.id, q]))
  let finalDue = 0
  let finalWeak = 0
  let finalNew = 0
  for (const id of ids) {
    const q = byId.get(id)
    if (!q) continue
    const p = progressById[q.id]
    if (!p) {
      finalNew += 1
      continue
    }
    if (isDue(p.nextReviewAt, today)) {
      finalDue += 1
      continue
    }
    if (isWeak(p, today)) {
      finalWeak += 1
    }
  }

  return {
    ids,
    breakdown: {
      due: finalDue,
      weak: finalWeak,
      new: finalNew,
    },
  }
}
