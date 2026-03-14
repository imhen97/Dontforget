// SM-2 Spaced Repetition System implementation
// quality: 0-5 (0=complete blackout, 5=perfect recall)

export interface SRSResult {
  nextInterval: number
  nextEaseFactor: number
  nextRepetitions: number
  nextReview: Date
}

export function calculateNextReview(
  quality: number,
  repetitions: number,
  easeFactor: number,
  interval: number
): SRSResult {
  let nextInterval: number
  let nextEaseFactor: number
  let nextRepetitions: number

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      nextInterval = 1
    } else if (repetitions === 1) {
      nextInterval = 6
    } else {
      nextInterval = Math.round(interval * easeFactor)
    }

    nextEaseFactor = Math.max(
      1.3,
      easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    )
    nextRepetitions = repetitions + 1
  } else {
    // Incorrect response - reset
    nextInterval = 1
    nextEaseFactor = Math.max(1.3, easeFactor - 0.2)
    nextRepetitions = 0
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + nextInterval)

  return { nextInterval, nextEaseFactor, nextRepetitions, nextReview }
}

export function qualityFromCorrect(correct: boolean, responseTime?: number): number {
  if (!correct) return 1
  if (responseTime && responseTime < 3000) return 5
  if (responseTime && responseTime < 6000) return 4
  return 3
}
