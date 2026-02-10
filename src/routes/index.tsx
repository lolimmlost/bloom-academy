import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { BookOpen, Flame, Sparkles, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useProgress } from "@/lib/progress/hooks"

const loadCourses = createServerFn({ method: "GET" })
  .inputValidator((d: undefined) => d)
  .handler(async () => {
    const { getCourses } = await import("@/lib/content/loader")
    const courses = getCourses()
    return courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      chapters: c.chapters.map((ch) => ({
        id: ch.id,
        slug: ch.slug,
        lessons: ch.lessons.map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
        })),
      })),
    }))
  })

export const Route = createFileRoute("/")({
  component: DashboardPage,
  loader: async () => {
    const courses = await loadCourses({ data: undefined })
    return { courses }
  },
})

function DashboardPage() {
  const { progress, currentLevel, xpProgress } = useProgress()
  const { courses } = Route.useLoaderData()

  const completedLessons = Object.values(progress.lessons).filter(
    (l) => l.status === "completed"
  ).length

  // Find the next lesson to continue with
  const continueTarget = findContinueTarget(courses, progress.lessons)

  return (
    <main className="p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">Continue your learning journey.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total XP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-yellow-500" />
              <span className="text-2xl font-bold">{progress.totalXP}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentLevel.level}</div>
            <p className="text-xs text-muted-foreground">{currentLevel.title}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="size-5 text-orange-500" />
              <span className="text-2xl font-bold">{progress.currentStreak}</span>
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-green-500" />
              <span className="text-2xl font-bold">{completedLessons}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Level Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level {currentLevel.level}: {currentLevel.title}</span>
              <span className="text-muted-foreground">{xpProgress.current} / {xpProgress.needed} XP</span>
            </div>
            <Progress value={xpProgress.percentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Continue Learning */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Continue Learning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{continueTarget.courseTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {continueTarget.lessonTitle
                  ? `Next: ${continueTarget.lessonTitle}`
                  : "Start your learning journey"}
              </p>
            </div>
            <ContinueButton target={continueTarget} />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

interface ContinueTarget {
  courseTitle: string
  lessonTitle: string | null
  courseSlug: string
  chapterSlug: string | null
  lessonSlug: string | null
  isStarted: boolean
}

function ContinueButton({ target }: { target: ContinueTarget }) {
  const label = target.isStarted ? "Continue" : "Start Learning"

  if (target.chapterSlug && target.lessonSlug) {
    return (
      <Button asChild>
        <Link
          to="/courses/$courseSlug/$chapterSlug/$lessonSlug"
          params={{
            courseSlug: target.courseSlug,
            chapterSlug: target.chapterSlug,
            lessonSlug: target.lessonSlug,
          }}
        >
          {label}
          <ArrowRight className="size-4 ml-2" />
        </Link>
      </Button>
    )
  }

  return (
    <Button asChild>
      <Link to="/courses/$courseSlug" params={{ courseSlug: target.courseSlug }}>
        {label}
        <ArrowRight className="size-4 ml-2" />
      </Link>
    </Button>
  )
}

function findContinueTarget(
  courses: { id: string; slug: string; title: string; chapters: { id: string; slug: string; lessons: { id: string; slug: string; title: string }[] }[] }[],
  lessons: Record<string, { status: string; courseId: string; chapterId: string; lessonId: string }>
): ContinueTarget {
  const fallback: ContinueTarget = {
    courseTitle: "Build an E-Commerce Site",
    lessonTitle: null,
    courseSlug: "build-ecommerce",
    chapterSlug: null,
    lessonSlug: null,
    isStarted: false,
  }

  if (courses.length === 0) return fallback

  const course = courses[0]

  // Look for a lesson that is in-progress first
  for (const ch of course.chapters) {
    for (const l of ch.lessons) {
      const key = `${course.id}:${ch.id}:${l.id}`
      if (lessons[key]?.status === "in-progress") {
        return {
          courseTitle: course.title,
          lessonTitle: l.title,
          courseSlug: course.slug,
          chapterSlug: ch.slug,
          lessonSlug: l.slug,
          isStarted: true,
        }
      }
    }
  }

  // Otherwise, find the first not-started lesson
  for (const ch of course.chapters) {
    for (const l of ch.lessons) {
      const key = `${course.id}:${ch.id}:${l.id}`
      if (!lessons[key] || lessons[key].status === "not-started") {
        return {
          courseTitle: course.title,
          lessonTitle: l.title,
          courseSlug: course.slug,
          chapterSlug: ch.slug,
          lessonSlug: l.slug,
          isStarted: Object.keys(lessons).length > 0,
        }
      }
    }
  }

  // All lessons completed — link to course overview
  return {
    courseTitle: course.title,
    lessonTitle: "All lessons completed!",
    courseSlug: course.slug,
    chapterSlug: null,
    lessonSlug: null,
    isStarted: true,
  }
}
