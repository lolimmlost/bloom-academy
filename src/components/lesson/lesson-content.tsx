import { ScrollArea } from "@/components/ui/scroll-area"
import { MarkdownRenderer } from "@/components/common/markdown-renderer"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

interface LessonContentProps {
  title: string
  body: string
  xp: number
  difficulty: number
  type: "info" | "code" | "quiz"
  children?: React.ReactNode
}

export function LessonContent({ title, body, xp, difficulty, type, children }: LessonContentProps) {
  // Strip leading h1 from markdown body since we render the title separately
  const trimmedBody = body.replace(/^\s*#\s+.+\n*/, "")

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">{type}</Badge>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="size-3" />
          {xp} XP
        </Badge>
        <Badge variant="secondary">
          Difficulty: {difficulty}/10
        </Badge>
      </div>

      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      <MarkdownRenderer content={trimmedBody} />

      {children}
    </div>
  )
}
