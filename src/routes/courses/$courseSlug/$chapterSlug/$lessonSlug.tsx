import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { useState, useCallback, useRef, useEffect } from "react"

import { LessonSkeleton } from "@/components/error/loading-skeleton"
import { LessonContent } from "@/components/lesson/lesson-content"
import { CodeChallenge } from "@/components/lesson/code-challenge"
import { LessonComplete } from "@/components/lesson/lesson-complete"
import { LessonNav } from "@/components/lesson/lesson-nav"
import { SignupPrompt } from "@/components/lesson/signup-prompt"
import { showXPGainToast } from "@/components/gamification/xp-gain-toast"
import { useProgress } from "@/lib/progress/hooks"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import type { AchievementDef } from "@/lib/gamification/achievements"
import type { LevelInfo } from "@/lib/gamification/levels"
import type { LessonContent as LessonContentType } from "@/lib/content/types"

interface ChapterLessonData {
  id: string
  slug: string
  title: string
  lessons: {
    id: string
    slug: string
    title: string
    type: "info" | "code" | "quiz"
    xp: number
    chapterSlug: string
  }[]
}

interface CourseData {
  chapters: ChapterLessonData[]
  allCourseLessonIds: string[]
}

const loadLesson = createServerFn({ method: "GET" })
  .inputValidator((data: { courseSlug: string; chapterSlug: string; lessonSlug: string }) => data)
  .handler(async ({ data }) => {
    const { getLesson } = await import("@/lib/content/loader")
    const lesson = getLesson(data.courseSlug, data.chapterSlug, data.lessonSlug)
    return lesson ?? null
  })

const loadChapterLessons = createServerFn({ method: "GET" })
  .inputValidator((data: { courseSlug: string }) => data)
  .handler(async ({ data }): Promise<CourseData> => {
    const { getCourse } = await import("@/lib/content/loader")
    const course = getCourse(data.courseSlug)
    if (!course) return { chapters: [], allCourseLessonIds: [] }

    const chapters: ChapterLessonData[] = course.chapters.map((ch) => ({
      id: ch.id,
      slug: ch.slug,
      title: ch.title,
      lessons: ch.lessons.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        type: l.type,
        xp: l.xp,
        chapterSlug: ch.slug,
      })),
    }))

    const allCourseLessonIds = course.chapters.flatMap((ch) =>
      ch.lessons.map((l) => l.id)
    )

    return { chapters, allCourseLessonIds }
  })

export const Route = createFileRoute(
  "/courses/$courseSlug/$chapterSlug/$lessonSlug"
)({
  component: LessonPage,
  pendingComponent: LessonSkeleton,
  loader: async ({ params }) => {
    const [lesson, courseData] = await Promise.all([
      loadLesson({ data: params }),
      loadChapterLessons({ data: { courseSlug: params.courseSlug } }),
    ])
    return { lesson, courseData }
  },
})

interface CompletionResult {
  xpEarned: number
  newLevel: LevelInfo | null
  achievementsUnlocked: AchievementDef[]
}

function LessonPage() {
  const loaderData = Route.useLoaderData() as { lesson: LessonContentType | null; courseData: CourseData }
  const { lesson, courseData } = loaderData
  const { courseSlug, chapterSlug } = Route.useParams()
  const navigate = useNavigate()
  const { completeLesson, getLessonStatus, markLessonInProgress, progress } = useProgress()
  const { data: session } = authClient.useSession()

  const [showComplete, setShowComplete] = useState(false)
  const [completionResult, setCompletionResult] = useState<CompletionResult | null>(null)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)
  const startTime = useRef(Date.now())

  // Compute navigation data
  const allLessonsFlat = courseData.chapters.flatMap((ch: ChapterLessonData) =>
    ch.lessons.map((l) => ({ ...l, courseSlug, chapterSlug: ch.slug }))
  )
  const currentIndex = allLessonsFlat.findIndex(
    (l: { slug: string; chapterSlug: string }) => l.slug === lesson?.slug && l.chapterSlug === chapterSlug
  )
  const prevLesson = currentIndex > 0 ? allLessonsFlat[currentIndex - 1] : undefined
  const nextLesson = currentIndex < allLessonsFlat.length - 1 ? allLessonsFlat[currentIndex + 1] : undefined

  // Current chapter lesson IDs for achievement tracking
  const currentChapter = courseData.chapters.find((ch: ChapterLessonData) => ch.slug === chapterSlug)
  const allChapterLessonIds = currentChapter?.lessons.map((l: { id: string }) => l.id) ?? []

  // Mark lesson in-progress on mount
  useEffect(() => {
    if (lesson) {
      markLessonInProgress(lesson.courseId, lesson.chapterId, lesson.id)
    }
  }, [lesson?.id])

  const doComplete = useCallback((params: {
    code: string
    attempts: number
    hintsUsed: number
    solutionViewed: boolean
    timeSpentSecs: number
  }) => {
    if (!lesson) return

    const result = completeLesson({
      courseId: lesson.courseId,
      chapterId: lesson.chapterId,
      lessonId: lesson.id,
      baseXP: lesson.xp,
      attempts: params.attempts,
      hintsUsed: params.hintsUsed,
      solutionViewed: params.solutionViewed,
      timeSpentSecs: params.timeSpentSecs,
      lastCode: params.code,
      allChapterLessons: allChapterLessonIds,
      allCourseLessons: courseData.allCourseLessonIds,
    })

    if (result.xpEarned > 0) {
      showXPGainToast(result.xpEarned)
    }

    setCompletionResult(result)
    setShowComplete(true)
  }, [lesson, completeLesson, allChapterLessonIds, courseData.allCourseLessonIds])

  const handleCodeComplete = useCallback((params: {
    code: string
    attempts: number
    hintsUsed: number
    solutionViewed: boolean
    timeSpentSecs: number
  }) => {
    doComplete(params)
  }, [doComplete])

  const handleInfoComplete = useCallback(() => {
    if (!lesson) return
    const timeSpentSecs = Math.round((Date.now() - startTime.current) / 1000)
    doComplete({
      code: "",
      attempts: 1,
      hintsUsed: 0,
      solutionViewed: false,
      timeSpentSecs,
    })
  }, [lesson, doComplete])

  const handleNextLesson = useCallback(() => {
    if (nextLesson) {
      setShowComplete(false)
      navigate({
        to: "/courses/$courseSlug/$chapterSlug/$lessonSlug",
        params: {
          courseSlug: nextLesson.courseSlug,
          chapterSlug: nextLesson.chapterSlug,
          lessonSlug: nextLesson.slug,
        },
      })
    }
  }, [nextLesson, navigate])

  const handleBackToCourse = useCallback(() => {
    setShowComplete(false)
    navigate({
      to: "/courses/$courseSlug",
      params: { courseSlug },
    })
  }, [courseSlug, navigate])

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Lesson not found</h2>
          <p className="text-muted-foreground">This lesson hasn't been created yet.</p>
        </div>
      </div>
    )
  }

  const isCompleted = getLessonStatus(lesson.courseId, lesson.chapterId, lesson.id) === "completed"
  const isInfoLesson = !lesson.challenge

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)]">
      {/* Left panel: Lesson content */}
      <div className="flex-1 lg:border-r flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          <LessonContent
            title={lesson.title}
            body={lesson.body}
            xp={lesson.xp}
            difficulty={lesson.difficulty}
            type={lesson.type}
          >
            {/* "Mark as Complete" button for info lessons */}
            {isInfoLesson && (
              <div className="mt-8">
                {isCompleted ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="size-5" />
                    <span className="font-medium">Lesson completed</span>
                  </div>
                ) : (
                  <Button onClick={handleInfoComplete} className="w-full sm:w-auto">
                    <CheckCircle2 className="size-4 mr-2" />
                    Mark as Complete
                  </Button>
                )}
              </div>
            )}
          </LessonContent>
        </div>

        {/* Prev / Next nav */}
        <LessonNav
          prevLesson={prevLesson ? { slug: prevLesson.slug, title: prevLesson.title, chapterSlug: prevLesson.chapterSlug, courseSlug: prevLesson.courseSlug } : undefined}
          nextLesson={nextLesson ? { slug: nextLesson.slug, title: nextLesson.title, chapterSlug: nextLesson.chapterSlug, courseSlug: nextLesson.courseSlug } : undefined}
          currentIndex={currentIndex}
          totalLessons={allLessonsFlat.length}
        />
      </div>

      {/* Right panel: Code challenge */}
      {lesson.challenge && (
        <div className="flex-1 flex flex-col border-t lg:border-t-0 min-h-[400px]">
          <CodeChallenge
            key={lesson.challenge.id}
            challenge={lesson.challenge}
            hints={lesson.hints ?? []}
            onComplete={handleCodeComplete}
          />
        </div>
      )}

      {/* Completion dialog */}
      <LessonComplete
        open={showComplete}
        onClose={() => {
          setShowComplete(false)
          // Show signup prompt for unauthenticated users after completing 2+ lessons
          const completedCount = Object.values(progress.lessons).filter((l) => l.status === "completed").length
          if (!session && completedCount >= 2) {
            setShowSignupPrompt(true)
          }
        }}
        xpEarned={completionResult?.xpEarned ?? 0}
        newLevel={completionResult?.newLevel}
        achievementsUnlocked={completionResult?.achievementsUnlocked ?? []}
        onNextLesson={nextLesson ? handleNextLesson : undefined}
        onBackToCourse={!nextLesson ? handleBackToCourse : undefined}
      />

      {/* Signup prompt for unauthenticated users */}
      <SignupPrompt
        open={showSignupPrompt}
        onClose={() => setShowSignupPrompt(false)}
      />
    </div>
  )
}
