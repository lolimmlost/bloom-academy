import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { CheckCircle2, Circle, ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useProgress } from "@/lib/progress/hooks"

const loadCourse = createServerFn({ method: "GET" })
  .inputValidator((data: { courseSlug: string }) => data)
  .handler(async ({ data }) => {
    const { getCourse } = await import("@/lib/content/loader")
    const course = getCourse(data.courseSlug)
    if (!course) return null
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      totalLessons: course.totalLessons,
      totalXP: course.totalXP,
      chapters: course.chapters.map((ch) => ({
        id: ch.id,
        slug: ch.slug,
        title: ch.title,
        description: ch.description,
        order: ch.order,
        lessons: ch.lessons.map((l) => ({
          id: l.id,
          slug: l.slug,
          title: l.title,
          type: l.type,
          xp: l.xp,
        })),
      })),
    }
  })

export const Route = createFileRoute("/courses/$courseSlug/")({
  component: CourseOverviewPage,
  loader: async ({ params }) => {
    const course = await loadCourse({ data: { courseSlug: params.courseSlug } })
    return { course }
  },
})

function CourseOverviewPage() {
  const { courseSlug } = Route.useParams()
  const { course } = Route.useLoaderData()
  const { getLessonStatus } = useProgress()

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Course not found</h2>
          <p className="text-muted-foreground">This course doesn't exist yet.</p>
        </div>
      </div>
    )
  }

  const completedLessons = course.chapters.reduce((sum, ch) => {
    return sum + ch.lessons.filter((l) =>
      getLessonStatus(course.id, ch.id, l.id) === "completed"
    ).length
  }, 0)

  const progressPercent = course.totalLessons > 0
    ? Math.round((completedLessons / course.totalLessons) * 100)
    : 0

  return (
    <main className="p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.description}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Course Progress</span>
            <span className="text-sm text-muted-foreground">{completedLessons} / {course.totalLessons} lessons</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {course.chapters.map((chapter, index) => {
          const chapterCompleted = chapter.lessons.filter((l) =>
            getLessonStatus(course.id, chapter.id, l.id) === "completed"
          ).length
          const allDone = chapterCompleted === chapter.lessons.length && chapter.lessons.length > 0

          return (
            <Collapsible key={chapter.id}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <CollapsibleTrigger className="flex items-center gap-4 w-full p-4 text-left cursor-pointer">
                    <div className="flex items-center justify-center size-10 rounded-full bg-muted text-sm font-bold shrink-0">
                      {allDone ? <CheckCircle2 className="size-5 text-green-500" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{chapter.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{chapter.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {chapterCompleted}/{chapter.lessons.length} lessons
                        </Badge>
                      </div>
                    </div>
                    <ChevronDown className="size-5 text-muted-foreground shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t px-4 pb-4">
                      {chapter.lessons.map((lesson) => {
                        const status = getLessonStatus(course.id, chapter.id, lesson.id)
                        return (
                          <Link
                            key={lesson.id}
                            to="/courses/$courseSlug/$chapterSlug/$lessonSlug"
                            params={{
                              courseSlug,
                              chapterSlug: chapter.slug,
                              lessonSlug: lesson.slug,
                            }}
                            className="flex items-center gap-3 py-2.5 hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors"
                          >
                            {status === "completed" ? (
                              <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                            ) : status === "in-progress" ? (
                              <Circle className="size-4 text-blue-500 shrink-0" />
                            ) : (
                              <Circle className="size-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="text-sm flex-1 truncate">{lesson.title}</span>
                            <Badge variant="outline" className="text-xs shrink-0">{lesson.type}</Badge>
                            <span className="text-xs text-muted-foreground shrink-0">{lesson.xp} XP</span>
                          </Link>
                        )
                      })}
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          )
        })}
      </div>
    </main>
  )
}
