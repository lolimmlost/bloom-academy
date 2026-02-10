import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import type { UserProgress, LessonProgressData, LessonStatus } from "./types"
import { DEFAULT_PROGRESS, lessonKey } from "./types"
import { loadProgress, saveProgress } from "./store"
import { getLevelForXP, getXPProgress, checkLevelUp } from "../gamification/levels"
import { calculateXP } from "../gamification/xp"
import { calculateStreak, getTodayDateString } from "../gamification/streaks"
import { checkNewAchievements, type AchievementDef } from "../gamification/achievements"

interface CompletionResult {
  xpEarned: number
  newLevel: ReturnType<typeof checkLevelUp>
  achievementsUnlocked: AchievementDef[]
}

interface ProgressContextValue {
  progress: UserProgress
  getLessonStatus: (courseId: string, chapterId: string, lessonId: string) => LessonStatus
  getLessonData: (courseId: string, chapterId: string, lessonId: string) => LessonProgressData | undefined
  completeLesson: (params: {
    courseId: string
    chapterId: string
    lessonId: string
    baseXP: number
    attempts: number
    hintsUsed: number
    solutionViewed: boolean
    timeSpentSecs: number
    lastCode: string
    allChapterLessons: string[]
    allCourseLessons: string[]
  }) => CompletionResult
  markLessonInProgress: (courseId: string, chapterId: string, lessonId: string) => void
  updateProgress: (updater: (prev: UserProgress) => UserProgress) => void
  xpProgress: ReturnType<typeof getXPProgress>
  currentLevel: ReturnType<typeof getLevelForXP>
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS)
  const progressRef = useRef(progress)
  progressRef.current = progress

  useEffect(() => {
    const loaded = loadProgress()
    setProgress(loaded)
    progressRef.current = loaded
  }, [])

  const updateProgress = useCallback((updater: (prev: UserProgress) => UserProgress) => {
    setProgress((prev) => {
      const next = updater(prev)
      saveProgress(next)
      progressRef.current = next
      return next
    })
  }, [])

  const getLessonStatus = useCallback(
    (courseId: string, chapterId: string, lessonId: string): LessonStatus => {
      const key = lessonKey(courseId, chapterId, lessonId)
      return progressRef.current.lessons[key]?.status ?? "not-started"
    },
    []
  )

  const getLessonData = useCallback(
    (courseId: string, chapterId: string, lessonId: string): LessonProgressData | undefined => {
      const key = lessonKey(courseId, chapterId, lessonId)
      return progressRef.current.lessons[key]
    },
    []
  )

  const completeLesson = useCallback(
    (params: {
      courseId: string
      chapterId: string
      lessonId: string
      baseXP: number
      attempts: number
      hintsUsed: number
      solutionViewed: boolean
      timeSpentSecs: number
      lastCode: string
      allChapterLessons: string[]
      allCourseLessons: string[]
    }): CompletionResult => {
      const key = lessonKey(params.courseId, params.chapterId, params.lessonId)
      const current = progressRef.current
      const existing = current.lessons[key]

      // Don't award XP for re-completions
      if (existing?.status === "completed") {
        updateProgress((prev) => ({
          ...prev,
          lessons: {
            ...prev.lessons,
            [key]: { ...prev.lessons[key], lastCode: params.lastCode },
          },
        }))
        return { xpEarned: 0, newLevel: null, achievementsUnlocked: [] }
      }

      const xpCalc = calculateXP({
        baseXP: params.baseXP,
        attempts: params.attempts,
        hintsUsed: params.hintsUsed,
        solutionViewed: params.solutionViewed,
        currentStreak: current.currentStreak,
      })

      const today = getTodayDateString()

      const lessonData: LessonProgressData = {
        courseId: params.courseId,
        chapterId: params.chapterId,
        lessonId: params.lessonId,
        status: "completed",
        xpEarned: xpCalc.total,
        attempts: params.attempts,
        hintsUsed: params.hintsUsed,
        solutionViewed: params.solutionViewed,
        lastCode: params.lastCode,
        timeSpentSecs: params.timeSpentSecs,
        completedAt: new Date().toISOString(),
      }

      // Use updateProgress with prev to avoid race conditions
      let result: CompletionResult = { xpEarned: 0, newLevel: null, achievementsUnlocked: [] }

      updateProgress((prev) => {
        const updatedLessons = { ...prev.lessons, [key]: lessonData }

        const newStreakDates = prev.streakDates.includes(today)
          ? prev.streakDates
          : [...prev.streakDates, today]
        const { currentStreak, longestStreak } = calculateStreak(newStreakDates)
        const newTotalXP = prev.totalXP + xpCalc.total
        const newLevel = checkLevelUp(prev.totalXP, newTotalXP)

        const completedLessons = Object.values(updatedLessons).filter((l) => l.status === "completed")
        const totalCompleted = completedLessons.length
        const noHintLessons = completedLessons.filter((l) => l.hintsUsed === 0).length
        const firstTryLessons = completedLessons.filter((l) => l.attempts === 1).length

        const completedChapterIds: string[] = []
        const chapterAllCompleted = params.allChapterLessons.every((id) =>
          Object.values(updatedLessons).some((l) => l.lessonId === id && l.status === "completed")
        )
        if (chapterAllCompleted) {
          completedChapterIds.push(params.chapterId)
        }

        const courseCompleted = params.allCourseLessons.every((id) =>
          Object.values(updatedLessons).some((l) => l.lessonId === id && l.status === "completed")
        )

        const chapterLessonsData = completedLessons.filter((l) => l.chapterId === params.chapterId)
        const chapterPerfect = chapterAllCompleted && chapterLessonsData.every((l) => l.attempts === 1)

        const achievements = checkNewAchievements({
          totalLessonsCompleted: totalCompleted,
          totalNoHintLessons: noHintLessons,
          totalFirstTryLessons: firstTryLessons,
          currentStreak,
          completedChapterIds,
          courseCompleted,
          lessonTimeSeconds: params.timeSpentSecs,
          chapterPerfect,
          unlockedAchievements: prev.unlockedAchievements,
        })

        const achievementXP = achievements.reduce((sum, a) => sum + a.xpReward, 0)

        result = {
          xpEarned: xpCalc.total + achievementXP,
          newLevel,
          achievementsUnlocked: achievements,
        }

        return {
          ...prev,
          totalXP: newTotalXP + achievementXP,
          level: getLevelForXP(newTotalXP + achievementXP).level,
          currentStreak,
          longestStreak,
          lastActiveDate: today,
          streakDates: newStreakDates,
          lessons: updatedLessons,
          unlockedAchievements: [
            ...prev.unlockedAchievements,
            ...achievements.map((a) => a.key),
          ],
        }
      })

      return result
    },
    [updateProgress]
  )

  const markLessonInProgress = useCallback(
    (courseId: string, chapterId: string, lessonId: string) => {
      updateProgress((prev) => {
        const key = lessonKey(courseId, chapterId, lessonId)
        const existing = prev.lessons[key]
        if (existing?.status === "completed") return prev

        return {
          ...prev,
          lessons: {
            ...prev.lessons,
            [key]: {
              courseId,
              chapterId,
              lessonId,
              status: "in-progress" as const,
              xpEarned: existing?.xpEarned ?? 0,
              attempts: existing?.attempts ?? 0,
              hintsUsed: existing?.hintsUsed ?? 0,
              solutionViewed: existing?.solutionViewed ?? false,
              lastCode: existing?.lastCode ?? null,
              timeSpentSecs: existing?.timeSpentSecs ?? 0,
              completedAt: null,
            },
          },
        }
      })
    },
    [updateProgress]
  )

  const value: ProgressContextValue = {
    progress,
    getLessonStatus,
    getLessonData,
    completeLesson,
    markLessonInProgress,
    updateProgress,
    xpProgress: getXPProgress(progress.totalXP),
    currentLevel: getLevelForXP(progress.totalXP),
  }

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

// During SSR, components may render before the provider is mounted.
// Return safe defaults instead of throwing so SSR can complete.
const SSR_FALLBACK: ProgressContextValue = {
  progress: DEFAULT_PROGRESS,
  getLessonStatus: () => "not-started",
  getLessonData: () => undefined,
  completeLesson: () => ({ xpEarned: 0, newLevel: null, achievementsUnlocked: [] }),
  markLessonInProgress: () => {},
  updateProgress: () => {},
  xpProgress: getXPProgress(0),
  currentLevel: getLevelForXP(0),
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  return ctx ?? SSR_FALLBACK
}
