import { Rating, createEmptyCard, fsrs, type Card } from 'ts-fsrs'
import { toLocalDateString } from './date'

export type FsrsGrade = Exclude<Rating, Rating.Manual>

export function gradeFromOutcome(outcome: 'wrong' | 'guessed' | 'knew'): FsrsGrade {
  if (outcome === 'wrong') return Rating.Again
  if (outcome === 'guessed') return Rating.Hard
  return Rating.Good
}

const scheduler = fsrs({
  // Keep defaults; v1 aims for simplicity.
})

export function createNewCard(now: Date): Card {
  const empty = createEmptyCard(now)
  return empty
}

export function nextCardState(currentCard: Card | undefined, now: Date, grade: FsrsGrade) {
  const base = currentCard ?? createNewCard(now)
  const result = scheduler.next(base, now, grade)
  return {
    card: result.card,
    nextReviewAt: toLocalDateString(result.card.due),
  }
}
