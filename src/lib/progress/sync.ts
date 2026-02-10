import type { UserProgress, LessonProgressData } from "./types"
import { lessonKey } from "./types"

export interface SyncResult {
  merged: UserProgress
  serverUpdated: boolean
}

export function mergeProgress(local: UserProgress, server: UserProgress): UserProgress {
  const mergedLessons: Record<string, LessonProgressData> = { ...server.lessons }

  for (const [key, localLesson] of Object.entries(local.lessons)) {
    const serverLesson = mergedLessons[key]

    if (!serverLesson) {
      // Lesson only in local
      mergedLessons[key] = localLesson
    } else {
      // Merge: prefer completed, keep highest XP
      mergedLessons[key] = {
        ...serverLesson,
        status:
          localLesson.status === "completed" || serverLesson.status === "completed"
            ? "completed"
            : localLesson.status === "in-progress" || serverLesson.status === "in-progress"
              ? "in-progress"
              : "not-started",
        xpEarned: Math.max(localLesson.xpEarned, serverLesson.xpEarned),
        attempts: Math.max(localLesson.attempts, serverLesson.attempts),
        lastCode: localLesson.lastCode ?? serverLesson.lastCode,
        completedAt: localLesson.completedAt ?? serverLesson.completedAt,
      }
    }
  }

  // Merge streak dates (union)
  const allStreakDates = [...new Set([...local.streakDates, ...server.streakDates])].sort()

  // Merge achievements (union)
  const allAchievements = [...new Set([...local.unlockedAchievements, ...server.unlockedAchievements])]

  // Recalculate totals from merged lessons
  const totalXP = Object.values(mergedLessons).reduce((sum, l) => sum + l.xpEarned, 0)

  return {
    totalXP,
    level: server.level, // Will be recalculated by the caller
    currentStreak: Math.max(local.currentStreak, server.currentStreak),
    longestStreak: Math.max(local.longestStreak, server.longestStreak),
    lastActiveDate: [local.lastActiveDate, server.lastActiveDate]
      .filter(Boolean)
      .sort()
      .pop() ?? null,
    lessons: mergedLessons,
    unlockedAchievements: allAchievements,
    streakDates: allStreakDates,
  }
}
