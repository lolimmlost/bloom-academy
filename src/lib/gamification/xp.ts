export interface XPCalculation {
  base: number
  firstTryBonus: number
  noHintsBonus: number
  noSolutionBonus: number
  streakBonus: number
  total: number
}

export function calculateXP(options: {
  baseXP: number
  attempts: number
  hintsUsed: number
  solutionViewed: boolean
  currentStreak: number
}): XPCalculation {
  const { baseXP, attempts, hintsUsed, solutionViewed, currentStreak } = options

  const base = baseXP
  const firstTryBonus = attempts === 1 ? 10 : 0
  const noHintsBonus = hintsUsed === 0 ? 5 : 0
  const noSolutionBonus = !solutionViewed ? 5 : 0
  const streakBonus = Math.min(currentStreak * 2, 20)

  return {
    base,
    firstTryBonus,
    noHintsBonus,
    noSolutionBonus,
    streakBonus,
    total: base + firstTryBonus + noHintsBonus + noSolutionBonus + streakBonus,
  }
}

export const CHAPTER_COMPLETION_BONUS = 50
export const COURSE_COMPLETION_BONUS = 200
