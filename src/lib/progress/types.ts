export type LessonStatus = "not-started" | "in-progress" | "completed"

export interface LessonProgressData {
  courseId: string
  chapterId: string
  lessonId: string
  status: LessonStatus
  xpEarned: number
  attempts: number
  hintsUsed: number
  solutionViewed: boolean
  lastCode: string | null
  timeSpentSecs: number
  completedAt: string | null
}

export interface UserProgress {
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  lessons: Record<string, LessonProgressData> // key: courseId:chapterId:lessonId
  unlockedAchievements: string[]
  streakDates: string[] // dates that had activity
}

export const DEFAULT_PROGRESS: UserProgress = {
  totalXP: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  lessons: {},
  unlockedAchievements: [],
  streakDates: [],
}

export function lessonKey(courseId: string, chapterId: string, lessonId: string): string {
  return `${courseId}:${chapterId}:${lessonId}`
}
