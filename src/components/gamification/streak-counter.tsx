import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreakCounterProps {
  streak: number
  className?: string
}

export function StreakCounter({ streak, className }: StreakCounterProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Flame className={cn("size-4", streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
      <span className="font-medium text-sm">{streak}</span>
    </div>
  )
}
