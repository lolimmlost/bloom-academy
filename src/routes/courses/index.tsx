import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { ArrowRight, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const loadCoursesList = createServerFn({ method: "GET" })
  .inputValidator((d: undefined) => d)
  .handler(async () => {
    const { getCourses } = await import("@/lib/content/loader")
    return getCourses().map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      totalChapters: c.chapters.length,
      totalLessons: c.totalLessons,
      totalXP: c.totalXP,
    }))
  })

export const Route = createFileRoute("/courses/")({
  component: CoursesPage,
  loader: () => loadCoursesList(),
})

function CoursesPage() {
  const courses = Route.useLoaderData()

  return (
    <main className="p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">Courses</h1>
        <p className="text-muted-foreground">Choose a course to start learning.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.slug} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-lg p-3">
                  <BookOpen className="size-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{course.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">
                  {course.totalChapters} {course.totalChapters === 1 ? "Chapter" : "Chapters"}
                </Badge>
                <Badge variant="secondary">
                  {course.totalLessons} {course.totalLessons === 1 ? "Lesson" : "Lessons"}
                </Badge>
                <Badge variant="secondary">{course.totalXP.toLocaleString()} XP</Badge>
              </div>
              <Button asChild className="w-full">
                <Link to="/courses/$courseSlug" params={{ courseSlug: course.slug }}>
                  View Course
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
