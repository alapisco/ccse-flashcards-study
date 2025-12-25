import type { Dataset, Question, TareaId } from '../domain/types'
import { SIMULACRO_DISTRIBUTION, TAREA_IDS } from '../domain/types'
import type { ProgressById } from '../domain/progress'
import { isWeak } from '../domain/weak'
import { isDue } from '../domain/status'

export type SimulacroType = 'oficial' | 'inteligente'

export type BuiltSimulacro = {
  ids: string[]
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]!
    arr[j] = tmp!
  }
  return arr
}

function stableSortById(questions: Question[]): Question[] {
  return [...questions].sort((a, b) => a.id.localeCompare(b.id))
}

function weightForQuestion(q: Question, progressById: ProgressById, today: string): number {
  const p = progressById[q.id]
  if (!p) return 1
  let w = 1
  if (isDue(p.nextReviewAt, today, p.lastSeenAt)) w += 4
  if (isWeak(p, today)) w += 3
  // Low mastery heuristic: shorter scheduled days => higher weight
  const scheduled = p.card.scheduled_days
  if (scheduled < 7) w += 2
  else if (scheduled < 30) w += 1
  return w
}

function pickWeighted(questions: Question[], count: number, weights: number[]): Question[] {
  const picked: Question[] = []
  const remaining = questions.map((q, idx) => ({ q, w: weights[idx] ?? 1 }))

  while (picked.length < count && remaining.length > 0) {
    const total = remaining.reduce((sum, r) => sum + r.w, 0)
    // deterministic-ish: pick highest weight; ties by id
    remaining.sort((a, b) => (b.w - a.w) || a.q.id.localeCompare(b.q.id))
    const chosen = remaining.shift()
    if (!chosen) break
    void total
    picked.push(chosen.q)
  }

  return picked
}

export function buildSimulacro(args: {
  dataset: Dataset
  progressById: ProgressById
  today: string
  type: SimulacroType
  rng?: () => number
}): BuiltSimulacro {
  const { dataset, progressById, today, type, rng = Math.random } = args
  const ids: string[] = []

  for (const tareaId of TAREA_IDS) {
    const needed = SIMULACRO_DISTRIBUTION[tareaId]
    const poolBase = stableSortById(dataset.questions.filter((q) => q.tareaId === tareaId))

    const pool = type === 'oficial' ? shuffle(poolBase, rng) : poolBase

    if (pool.length < needed) {
      throw new Error(`Dataset lacks enough questions for tarea ${tareaId} (need ${needed}, got ${pool.length})`)
    }

    const selected =
      type === 'oficial'
        ? pool.slice(0, needed)
        : pickWeighted(pool, needed, pool.map((q) => weightForQuestion(q, progressById, today)))

    ids.push(...selected.map((q) => q.id))
  }

  return { ids }
}

export function scoreSimulacro(args: {
  ids: string[]
  correctById: Record<string, boolean>
  dataset: Dataset
}): {
  totalCorrect: number
  total: number
  apto: boolean
  byTarea: Record<TareaId, { correct: number; total: number }>
} {
  const { ids, correctById, dataset } = args

  const byTarea = {
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 },
    4: { correct: 0, total: 0 },
    5: { correct: 0, total: 0 },
  } as Record<TareaId, { correct: number; total: number }>

  let totalCorrect = 0
  for (const id of ids) {
    const q = dataset.questions.find((qq) => qq.id === id)
    if (!q) continue
    byTarea[q.tareaId].total += 1
    if (correctById[id]) {
      byTarea[q.tareaId].correct += 1
      totalCorrect += 1
    }
  }

  return {
    totalCorrect,
    total: ids.length,
    apto: totalCorrect >= 15,
    byTarea,
  }
}
