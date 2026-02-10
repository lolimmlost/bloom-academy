import { z } from "zod"

export const completeLessonSchema = z.object({
  courseId: z.string(),
  chapterId: z.string(),
  lessonId: z.string(),
  code: z.string().optional(),
  attempts: z.number().int().min(1),
  hintsUsed: z.number().int().min(0),
  solutionViewed: z.boolean(),
  timeSpentSecs: z.number().int().min(0),
})

export const syncProgressSchema = z.object({
  progress: z.array(
    z.object({
      courseId: z.string(),
      chapterId: z.string(),
      lessonId: z.string(),
      status: z.string(),
      xpEarned: z.number(),
      attempts: z.number(),
      hintsUsed: z.number(),
      solutionViewed: z.boolean(),
      lastCode: z.string().nullable(),
      timeSpentSecs: z.number(),
      completedAt: z.string().nullable(),
    })
  ),
})

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  editorFontSize: z.number().int().min(10).max(24).optional(),
  editorTabSize: z.number().int().min(2).max(8).optional(),
  soundEnabled: z.boolean().optional(),
})
