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
  // Rule of thumb: ~50% of the scope, clamped to [6..25], and never equal to the full scope.
  const scopeCount = questions.length
  const dynamicBase = Math.round(scopeCount * 0.5)
  const dynamicClamped = Math.max(6, Math.min(25, dynamicBase))
  const dynamicSafe = Math.min(dynamicClamped, Math.max(0, scopeCount - 1))
  const avoidRecentCount = avoidRecentCountArg ?? dynamicSafe

  const recentSet = new Set(recentIds.slice(-avoidRecentCount))
  const recencyIndex = new Map<string, number>()
  for (let i = 0; i < recentIds.length; i += 1) {
    recencyIndex.set(recentIds[i]!, i)
  }

  const sortCandidates = (candidates: Question[]) => {
    const base = [...candidates]

    // When starting a new intelligent session (recentIds empty), avoid always picking the lowest-id
    // learning question over and over. Prefer the least-recently-seen question instead.
    if (recentIds.length === 0) {
      base.sort((a, b) => {
        const aSeen = progressById[a.id]?.lastSeenAt
        const bSeen = progressById[b.id]?.lastSeenAt

        if (aSeen && bSeen && aSeen !== bSeen) return aSeen.localeCompare(bSeen)
        if (!aSeen && bSeen) return -1
        if (aSeen && !bSeen) return 1
        return a.id.localeCompare(b.id)
      })
      return base
    }

    base.sort((a, b) => a.id.localeCompare(b.id))
    return base
  }

  const pickAny = (candidates: Question[]): string | null => {
    if (candidates.length === 0) return null

    return sortCandidates(candidates)[0]!.id
  }

  const pickPreferNonRecent = (candidates: Question[]): string | null => {
    if (candidates.length === 0) return null
    const filtered = candidates.filter((q) => !recentSet.has(q.id))
    if (filtered.length === 0) return null
    return sortCandidates(filtered)[0]!.id
  }

  // If all candidates are "recent", prefer the one that was seen least recently.
  // This prevents the fallback path from repeatedly selecting the same lowest-id question.
  const pickLeastRecent = (candidates: Question[]): string | null => {
    if (candidates.length === 0) return null

    let best: Question | null = null
    let bestIndex = Number.POSITIVE_INFINITY

    for (const q of candidates) {
      const idx = recencyIndex.get(q.id)
      if (idx === undefined) continue
      if (idx < bestIndex) {
        best = q
        bestIndex = idx
      }
    }

    if (best) return best.id
    return pickAny(candidates)
  }

  const wasKnewToday = (q: Question) => {
    const p = progressById[q.id]
    return Boolean(p && p.lastSeenAt === today && p.lastResult === 'knew')
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
  const weakKnewToday: Question[] = []
  const newly: Question[] = []
  const learning: Question[] = []
  const learningKnewToday: Question[] = []

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
      // If the user just marked this as "knew" today, deprioritize it strongly.
      // It can still be shown as a last resort (tiny scope).
      if (wasKnewToday(q)) weakKnewToday.push(q)
      else weak.push(q)
      continue
    }

    if (wasKnewToday(q)) learningKnewToday.push(q)
    else learning.push(q)
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
  return (
    pickLeastRecent(due) ??
    pickLeastRecent(weak) ??
    pickLeastRecent(newly) ??
    pickLeastRecent(learning) ??
    pickLeastRecent(weakKnewToday) ??
    pickLeastRecent(learningKnewToday) ??
    null
  )
}
