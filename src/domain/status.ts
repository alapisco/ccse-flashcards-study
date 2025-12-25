import type { Dataset, Question } from './types'
import type { ProgressById } from './progress'
import { isWeak } from './weak'

export type QuestionStatus = 'new' | 'due' | 'weak' | 'mastered' | 'learning'

export function isDue(progressNextReviewAt: string | undefined, today: string, lastSeenAt?: string): boolean {
  if (!progressNextReviewAt) return false

  // We store review dates as YYYY-MM-DD (local date) even though FSRS schedules
  // at a timestamp granularity. This helper prevents “same day” immediate repeats:
  // - If an item is scheduled for today but was already seen today, treat it as not due.
  if (progressNextReviewAt < today) return true
  if (progressNextReviewAt > today) return false
  return lastSeenAt !== today
}

export function isMastered(progress: ProgressById[string] | undefined): boolean {
  if (!progress) return false

  // Practical, implementation-defined rule:
  // - If the scheduler has pushed the item out at least a week, it's clearly well learned.
  // - Otherwise, allow it to become “bien aprendida” based on consistent correctness,
  //   even if the user is practicing heavily within the same day.
  if (progress.card.scheduled_days >= 7) return true

  const correct = progress.correctCount ?? 0
  const wrong = progress.wrongCount ?? 0
  const netCorrect = correct - wrong
  if (netCorrect >= 3 && progress.lastResult !== 'wrong') return true

  return false
}

export function getQuestionStatus(
  question: Question,
  dataset: Dataset,
  progressById: ProgressById,
  today: string,
): QuestionStatus {
  void dataset
  const p = progressById[question.id]
  if (!p) return 'new'
  if (isDue(p.nextReviewAt, today, p.lastSeenAt)) return 'due'
  if (isWeak(p, today)) return 'weak'
  if (isMastered(p)) return 'mastered'
  return 'learning'
}
