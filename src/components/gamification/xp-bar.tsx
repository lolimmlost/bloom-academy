import { Sparkles } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface XPBarProps {
  current: number
  needed: number
  percentage: number
  level: number
  className?: string
}

export function XPBar({ current, needed, percentage, level, className }: XPBarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs font-medium text-muted-foreground">Lv.{level}</span>
      <Progress value={percentage} className="h-2 flex-1" />
      <span className="text-xs text-muted-foreground">
        {current}/{needed}
      </span>
    </div>
  )
}
