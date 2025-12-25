import type { Card } from 'ts-fsrs'

export type LastResult = 'wrong' | 'guessed' | 'knew'

export type QuestionProgress = {
  card: Card
  nextReviewAt: string // YYYY-MM-DD (Europe/Madrid local date)
  seenCount: number
  correctCount: number
  wrongCount: number
  lastSeenAt?: string
  lastWrongAt?: string
  lastResult?: LastResult
  leechScore: number
  manualWeak?: boolean
}

export type ProgressById = Record<string, QuestionProgress>
