import { useMemo } from "react"
import { useProgress } from "@/lib/progress/hooks"
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/gamification/achievements"

export function useGamification() {
  const { progress, currentLevel, xpProgress } = useProgress()

  const achievements = useMemo(() => {
    return ACHIEVEMENT_DEFINITIONS.map((def) => ({
      ...def,
      unlocked: progress.unlockedAchievements.includes(def.key),
    }))
  }, [progress.unlockedAchievements])

  const completedLessons = useMemo(() => {
    return Object.values(progress.lessons).filter((l) => l.status === "completed").length
  }, [progress.lessons])

  return {
    totalXP: progress.totalXP,
    currentLevel,
    xpProgress,
    currentStreak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    completedLessons,
    achievements,
    totalAchievements: ACHIEVEMENT_DEFINITIONS.length,
    unlockedCount: progress.unlockedAchievements.length,
  }
}
