import type { QuestionProgress } from './progress'

export function clampMin(value: number, min: number): number {
  return value < min ? min : value
}

export function isWeak(progress: QuestionProgress | undefined, today: string): boolean {
  if (!progress) return false
  if (progress.manualWeak) return true
  if (progress.wrongCount >= 3) return true
  if (progress.leechScore >= 4) return true
  if (progress.lastResult === 'guessed') return true

  if (progress.lastWrongAt) {
    // last 7 days (inclusive)
    const lastWrong = Date.parse(progress.lastWrongAt)
    const now = Date.parse(today)
    if (!Number.isNaN(lastWrong) && !Number.isNaN(now)) {
      const diffDays = Math.floor((now - lastWrong) / (24 * 60 * 60 * 1000))
      if (diffDays <= 7) return true
    }
  }

  return false
}

export function applyLeechDelta(
  current: number,
  outcome: 'wrong' | 'guessed' | 'knew',
): number {
  if (outcome === 'wrong') return current + 2
  if (outcome === 'guessed') return current + 1
  return clampMin(current - 1, 0)
}
