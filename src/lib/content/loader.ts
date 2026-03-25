import fs from "node:fs"
import path from "node:path"
import type { Course, Chapter, LessonMeta, LessonContent, Challenge, QuizQuestion } from "./types"
import { parseLesson } from "./parser"

const CONTENT_DIR = path.resolve(process.cwd(), "content/courses")

export function getCourses(): Course[] {
  if (!fs.existsSync(CONTENT_DIR)) return []

  const courseDirs = fs.readdirSync(CONTENT_DIR).filter((d) => {
    return fs.statSync(path.join(CONTENT_DIR, d)).isDirectory()
  })

  return courseDirs.map((dir) => {
    const coursePath = path.join(CONTENT_DIR, dir)
    const courseJson = JSON.parse(fs.readFileSync(path.join(coursePath, "course.json"), "utf-8"))
    const chapters = getChapters(coursePath, courseJson.id)

    return {
      ...courseJson,
      chapters,
      totalLessons: chapters.reduce((sum, ch) => sum + ch.lessons.length, 0),
      totalXP: chapters.reduce((sum, ch) => sum + ch.lessons.reduce((s, l) => s + l.xp, 0), 0),
    }
  })
}

export function getCourse(slug: string): Course | undefined {
  const courses = getCourses()
  return courses.find((c) => c.slug === slug)
}

function getChapters(coursePath: string, courseId: string): Chapter[] {
  const dirs = fs.readdirSync(coursePath).filter((d) => {
    return d.startsWith("ch") && fs.statSync(path.join(coursePath, d)).isDirectory()
  }).sort()

  return dirs.map((dir) => {
    const chapterPath = path.join(coursePath, dir)
    const chapterJson = JSON.parse(fs.readFileSync(path.join(chapterPath, "chapter.json"), "utf-8"))
    const lessons = getLessonsInChapter(chapterPath, courseId, chapterJson.id)

    return {
      ...chapterJson,
      lessons,
    }
  })
}

function getLessonsInChapter(chapterPath: string, courseId: string, chapterId: string): LessonMeta[] {
  const files = fs.readdirSync(chapterPath)
    .filter((f) => f.endsWith(".md"))
    .sort()

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(chapterPath, file), "utf-8")
    const { meta } = parseLesson(raw, courseId, chapterId)
    return meta
  })
}

export function getLesson(courseSlug: string, chapterSlug: string, lessonSlug: string): LessonContent | undefined {
  const coursePath = path.join(CONTENT_DIR, courseSlug)
  if (!fs.existsSync(coursePath)) return undefined

  const courseJson = JSON.parse(fs.readFileSync(path.join(coursePath, "course.json"), "utf-8"))

  const chapterPath = path.join(coursePath, chapterSlug)
  if (!fs.existsSync(chapterPath)) return undefined

  const chapterJson = JSON.parse(fs.readFileSync(path.join(chapterPath, "chapter.json"), "utf-8"))

  // Find the markdown file matching the lesson slug
  const files = fs.readdirSync(chapterPath).filter((f) => f.endsWith(".md"))
  const file = files.find((f) => {
    const raw = fs.readFileSync(path.join(chapterPath, f), "utf-8")
    const { meta } = parseLesson(raw, courseJson.id, chapterJson.id)
    return meta.slug === lessonSlug
  })

  if (!file) return undefined

  const raw = fs.readFileSync(path.join(chapterPath, file), "utf-8")
  const { meta, body } = parseLesson(raw, courseJson.id, chapterJson.id)

  // Load challenge / quiz if exists
  const challengeDir = path.join(chapterPath, "challenges")
  let challenge: Challenge | undefined
  let quizQuestions: QuizQuestion[] | undefined

  if (fs.existsSync(challengeDir)) {
    const challengeFile = fs.readdirSync(challengeDir).find((f) => f.startsWith(lessonSlug) && f.endsWith(".challenge.json"))
    if (challengeFile) {
      challenge = JSON.parse(fs.readFileSync(path.join(challengeDir, challengeFile), "utf-8"))
    }

    const quizFile = fs.readdirSync(challengeDir).find((f) => f.startsWith(lessonSlug) && f.endsWith(".quiz.json"))
    if (quizFile) {
      quizQuestions = JSON.parse(fs.readFileSync(path.join(challengeDir, quizFile), "utf-8"))
    }
  }

  return { ...meta, body, challenge, quizQuestions }
}
