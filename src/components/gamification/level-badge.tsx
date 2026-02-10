import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { GraduationCap } from "lucide-react"

interface LevelBadgeProps {
  level: number
  title: string
  className?: string
}

export function LevelBadge({ level, title, className }: LevelBadgeProps) {
  return (
    <Badge variant="secondary" className={cn("gap-1", className)}>
      <GraduationCap className="size-3" />
      Lv. {level} — {title}
    </Badge>
  )
}
