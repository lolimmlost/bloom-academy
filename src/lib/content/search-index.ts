import { createServerFn } from "@tanstack/react-start"

interface SearchItem {
  lessonId: string
  lessonTitle: string
  lessonSlug: string
  lessonType: "info" | "code" | "quiz"
  chapterTitle: string
  chapterSlug: string
  courseTitle: string
  courseSlug: string
  xp: number
}

export const loadSearchNav = createServerFn({ method: "GET" })
  .inputValidator((d: undefined) => d)
  .handler(async (): Promise<SearchItem[]> => {
    const { getCourses } = await import("@/lib/content/loader")

    const items: SearchItem[] = []
    for (const course of getCourses()) {
      for (const chapter of course.chapters) {
        for (const lesson of chapter.lessons) {
          items.push({
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            lessonSlug: lesson.slug,
            lessonType: lesson.type,
            chapterTitle: chapter.title,
            chapterSlug: chapter.slug,
            courseTitle: course.title,
            courseSlug: course.slug,
            xp: lesson.xp,
          })
        }
      }
    }
    return items
  })
