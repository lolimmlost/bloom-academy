import matter from "gray-matter"
import { frontmatterSchema } from "./schemas"
import type { LessonMeta, LessonContent } from "./types"

export function parseLesson(
  raw: string,
  courseId: string,
  chapterId: string
): { meta: LessonMeta; body: string } {
  const { data, content } = matter(raw)
  const parsed = frontmatterSchema.parse(data)

  return {
    meta: {
      ...parsed,
      slug: parsed.id,
      chapterId,
      courseId,
    },
    body: content,
  }
}

export function parseLessonWithContent(
  raw: string,
  courseId: string,
  chapterId: string
): Omit<LessonContent, "challenge"> {
  const { meta, body } = parseLesson(raw, courseId, chapterId)
  return { ...meta, body }
}
