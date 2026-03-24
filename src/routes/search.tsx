import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { useState, useMemo } from "react"
import { Search, BookOpen, Code, Info, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useProgress } from "@/lib/progress/hooks"

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
  body: string
}

const loadSearchIndex = createServerFn({ method: "GET" })
  .inputValidator((d: undefined) => d)
  .handler(async (): Promise<SearchItem[]> => {
    const { getCourses } = await import("@/lib/content/loader")
    const { parseLesson } = await import("@/lib/content/parser")
    const fs = await import("node:fs")
    const path = await import("node:path")

    const CONTENT_DIR = path.resolve(process.cwd(), "content/courses")
    const items: SearchItem[] = []

    for (const course of getCourses()) {
      const coursePath = path.join(CONTENT_DIR, course.slug)
      for (const chapter of course.chapters) {
        const chapterPath = path.join(coursePath, chapter.slug)
        const files = fs.readdirSync(chapterPath).filter((f: string) => f.endsWith(".md")).sort()
        for (const file of files) {
          const raw = fs.readFileSync(path.join(chapterPath, file), "utf-8")
          const { meta, body } = parseLesson(raw, course.id, chapter.id)
          items.push({
            lessonId: meta.id,
            lessonTitle: meta.title,
            lessonSlug: meta.slug,
            lessonType: meta.type,
            chapterTitle: chapter.title,
            chapterSlug: chapter.slug,
            courseTitle: course.title,
            courseSlug: course.slug,
            xp: meta.xp,
            body: body.slice(0, 500),
          })
        }
      }
    }
    return items
  })

export const Route = createFileRoute("/search")({
  component: SearchPage,
  loader: () => loadSearchIndex(),
})

const typeIcons = {
  info: Info,
  code: Code,
  quiz: FileText,
} as const

function SearchPage() {
  const items = Route.useLoaderData()
  const [query, setQuery] = useState("")
  const { getLessonStatus } = useProgress()

  const results = useMemo(() => {
    if (!query.trim()) return items
    const lower = query.toLowerCase()
    return items.filter(
      (item) =>
        item.lessonTitle.toLowerCase().includes(lower) ||
        item.chapterTitle.toLowerCase().includes(lower) ||
        item.courseTitle.toLowerCase().includes(lower) ||
        item.body.toLowerCase().includes(lower)
    )
  }, [query, items])

  return (
    <main className="p-6 space-y-6 max-w-2xl mx-auto pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-muted-foreground">Find lessons across all courses.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search lessons, chapters, content..."
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {results.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <Search className="size-12 mx-auto mb-4 opacity-20" />
          <p>No results found for &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-2">
          {query.trim() && (
            <p className="text-sm text-muted-foreground">
              {results.length} {results.length === 1 ? "result" : "results"}
            </p>
          )}
          {results.map((item) => {
            const Icon = typeIcons[item.lessonType] ?? BookOpen
            const status = getLessonStatus(item.courseSlug, item.chapterSlug, item.lessonId)
            return (
              <Link
                key={`${item.courseSlug}-${item.chapterSlug}-${item.lessonSlug}`}
                to="/courses/$courseSlug/$chapterSlug/$lessonSlug"
                params={{
                  courseSlug: item.courseSlug,
                  chapterSlug: item.chapterSlug,
                  lessonSlug: item.lessonSlug,
                }}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="mt-0.5 shrink-0">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{item.lessonTitle}</span>
                    {status === "completed" && (
                      <Badge variant="secondary" className="text-xs shrink-0">Done</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.courseTitle} &middot; {item.chapterTitle}
                  </p>
                </div>
                <div className="shrink-0">
                  <Badge variant="outline" className="text-xs">{item.xp} XP</Badge>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
