import { Link } from "@tanstack/react-router"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface LessonNavProps {
  prevLesson?: { slug: string; title: string; chapterSlug: string; courseSlug: string }
  nextLesson?: { slug: string; title: string; chapterSlug: string; courseSlug: string }
  currentIndex: number
  totalLessons: number
}

export function LessonNav({ prevLesson, nextLesson, currentIndex, totalLessons }: LessonNavProps) {
  const progress = totalLessons > 0 ? Math.round(((currentIndex + 1) / totalLessons) * 100) : 0

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-t">
      <Button
        variant="ghost"
        size="sm"
        disabled={!prevLesson}
        asChild={!!prevLesson}
      >
        {prevLesson ? (
          <Link
            to="/courses/$courseSlug/$chapterSlug/$lessonSlug"
            params={{
              courseSlug: prevLesson.courseSlug,
              chapterSlug: prevLesson.chapterSlug,
              lessonSlug: prevLesson.slug,
            }}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Link>
        ) : (
          <span>
            <ChevronLeft className="size-4" />
            Prev
          </span>
        )}
      </Button>

      <div className="flex-1 flex items-center gap-2">
        <Progress value={progress} className="h-2" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {currentIndex + 1}/{totalLessons}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        disabled={!nextLesson}
        asChild={!!nextLesson}
      >
        {nextLesson ? (
          <Link
            to="/courses/$courseSlug/$chapterSlug/$lessonSlug"
            params={{
              courseSlug: nextLesson.courseSlug,
              chapterSlug: nextLesson.chapterSlug,
              lessonSlug: nextLesson.slug,
            }}
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span>
            Next
            <ChevronRight className="size-4" />
          </span>
        )}
      </Button>
    </div>
  )
}
