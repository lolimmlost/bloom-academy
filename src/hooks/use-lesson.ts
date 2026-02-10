import { useState, useCallback, useEffect, useRef } from "react"
import type { LessonContent, Challenge } from "@/lib/content/types"
import { useProgress } from "@/lib/progress/hooks"
import type { AchievementDef } from "@/lib/gamification/achievements"
import type { LevelInfo } from "@/lib/gamification/levels"

interface UseLessonOptions {
  courseId: string
  chapterId: string
  lesson: LessonContent
  allChapterLessons: string[]
  allCourseLessons: string[]
}

interface CompletionResult {
  xpEarned: number
  newLevel: LevelInfo | null
  achievementsUnlocked: AchievementDef[]
}

export function useLesson(options: UseLessonOptions) {
  const { courseId, chapterId, lesson, allChapterLessons, allCourseLessons } = options
  const { getLessonData, completeLesson, markLessonInProgress } = useProgress()

  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null)
  const [showComplete, setShowComplete] = useState(false)

  const existingData = getLessonData(courseId, chapterId, lesson.id)
  const isCompleted = existingData?.status === "completed"

  useEffect(() => {
    if (!isCompleted) {
      markLessonInProgress(courseId, chapterId, lesson.id)
    }
  }, [courseId, chapterId, lesson.id, isCompleted, markLessonInProgress])

  const handleComplete = useCallback(
    (params: {
      code: string
      attempts: number
      hintsUsed: number
      solutionViewed: boolean
      timeSpentSecs: number
    }) => {
      const result = completeLesson({
        courseId,
        chapterId,
        lessonId: lesson.id,
        baseXP: lesson.xp,
        attempts: params.attempts,
        hintsUsed: params.hintsUsed,
        solutionViewed: params.solutionViewed,
        timeSpentSecs: params.timeSpentSecs,
        lastCode: params.code,
        allChapterLessons,
        allCourseLessons,
      })

      setCompletionResult(result)
      setShowComplete(true)
    },
    [courseId, chapterId, lesson, allChapterLessons, allCourseLessons, completeLesson]
  )

  return {
    existingData,
    isCompleted,
    completionResult,
    showComplete,
    setShowComplete,
    handleComplete,
  }
}
