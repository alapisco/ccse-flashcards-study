import type { Dataset, Question, TareaId } from '../domain/types'
import type { ProgressById } from '../domain/progress'
import { isDue } from '../domain/status'
import { isWeak } from '../domain/weak'

export type IntelligentConstraint =
  | { kind: 'all' }
  | { kind: 'tarea'; tareaId: TareaId }

export function getNextIntelligentQuestion(args: {
  dataset: Dataset
  progressById: ProgressById
  today: string
  constraint?: IntelligentConstraint
  recentIds?: string[]
  priorityIds?: string[]
  avoidRecentCount?: number
}): string | null {
  const {
    dataset,
    progressById,
    today,
    constraint = { kind: 'all' },
    recentIds = [],
    priorityIds = [],
    avoidRecentCount: avoidRecentCountArg,
  } = args

  const inScope = (q: Question) => {
    if (constraint.kind === 'all') return true
    return q.tareaId === constraint.tareaId
  }

  const questions = dataset.questions.filter(inScope)
  const byId = new Map(questions.map((q) => [q.id, q] as const))

  // Dynamic “avoid recent” window:
  // - Smaller scopes (e.g., a single tarea) should avoid fewer recent items to prevent starvation.
  // - Larger scopes should avoid more to reduce perceived repetition.
  // Rule of thumb: ~40% of the scope, clamped to [4..20], and never equal to the full scope.
  const scopeCount = questions.length
  const dynamicBase = Math.round(scopeCount * 0.4)
  const dynamicClamped = Math.max(4, Math.min(20, dynamicBase))
  const dynamicSafe = Math.min(dynamicClamped, Math.max(0, scopeCount - 1))
  const avoidRecentCount = avoidRecentCountArg ?? dynamicSafe

  const recentSet = new Set(recentIds.slice(-avoidRecentCount))

  const pickAny = (candidates: Question[]): string | null => {
    if (candidates.length === 0) return null

    const base = [...candidates]
    base.sort((a, b) => a.id.localeCompare(b.id))
    return base[0]!.id
  }

  const pickPreferNonRecent = (candidates: Question[]): string | null => {
    if (candidates.length === 0) return null
    const filtered = candidates.filter((q) => !recentSet.has(q.id))
    if (filtered.length === 0) return null
    filtered.sort((a, b) => a.id.localeCompare(b.id))
    return filtered[0]!.id
  }

  // Priority IDs (e.g., review wrong answers first).
  if (priorityIds.length > 0) {
    const prioritized: Question[] = []
    for (const id of priorityIds) {
      const q = byId.get(id)
      if (q) prioritized.push(q)
    }
    const picked = pickPreferNonRecent(prioritized) ?? pickAny(prioritized)
    if (picked) return picked
  }

  const due: Question[] = []
  const weak: Question[] = []
  const newly: Question[] = []
  const learning: Question[] = []

  for (const q of questions) {
    const p = progressById[q.id]
    if (!p) {
      newly.push(q)
      continue
    }

    if (isDue(p.nextReviewAt, today, p.lastSeenAt)) {
      due.push(q)
      continue
    }

    if (isWeak(p, today)) {
      weak.push(q)
      continue
    }

    learning.push(q)
  }

  // Never get stuck repeating the same question: if a bucket only contains “recent” items,
  // fall through to the next bucket.
  const preferred =
    pickPreferNonRecent(due) ??
    pickPreferNonRecent(weak) ??
    pickPreferNonRecent(newly) ??
    pickPreferNonRecent(learning)

  if (preferred) return preferred

  // Fallback (e.g., tiny dataset/scope): allow repeats.
  return pickAny(due) ?? pickAny(weak) ?? pickAny(newly) ?? pickAny(learning) ?? null
}
