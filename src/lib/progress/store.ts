import type { UserProgress, LessonProgressData } from "./types"
import { DEFAULT_PROGRESS, lessonKey } from "./types"

const STORAGE_KEY = "bloom-academy-progress"

export function loadProgress(): UserProgress {
  if (typeof window === "undefined") return { ...DEFAULT_PROGRESS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    return JSON.parse(raw)
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // localStorage might be full or unavailable
  }
}

export function getLessonProgress(
  progress: UserProgress,
  courseId: string,
  chapterId: string,
  lessonId: string
): LessonProgressData | undefined {
  const key = lessonKey(courseId, chapterId, lessonId)
  return progress.lessons[key]
}

export function updateLessonProgress(
  progress: UserProgress,
  data: LessonProgressData
): UserProgress {
  const key = lessonKey(data.courseId, data.chapterId, data.lessonId)
  const updated = {
    ...progress,
    lessons: {
      ...progress.lessons,
      [key]: data,
    },
  }
  saveProgress(updated)
  return updated
}

export function clearProgress(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}
