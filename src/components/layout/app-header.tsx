import { Link } from "@tanstack/react-router"
import { UserButton } from "@daveyplate/better-auth-ui"
import { Flame, Sparkles } from "lucide-react"

import { ModeToggle } from "@/components/mode-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useProgress } from "@/lib/progress/hooks"

export function AppHeader() {
  const { progress, currentLevel, xpProgress } = useProgress()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex flex-1 items-center gap-4">
        <Link to="/" className="font-semibold text-sm hidden md:block">
          Bloom Academy
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Streak */}
        <div className="flex items-center gap-1 text-sm">
          <Flame className="size-4 text-orange-500" />
          <span className="font-medium">{progress.currentStreak}</span>
        </div>

        {/* XP / Level */}
        <div className="hidden sm:flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" />
            Lv. {currentLevel.level}
          </Badge>
          <div className="flex items-center gap-2 w-24">
            <Progress value={xpProgress.percentage} className="h-2" />
          </div>
          <span className="text-xs text-muted-foreground">
            {progress.totalXP} XP
          </span>
        </div>

        <ModeToggle />
        <UserButton size="icon" />
      </div>
    </header>
  )
}
