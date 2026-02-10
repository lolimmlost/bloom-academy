import { Trophy, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AchievementCardProps {
  name: string
  description: string
  icon: string
  xpReward: number
  unlocked: boolean
  className?: string
}

export function AchievementCard({
  name,
  description,
  xpReward,
  unlocked,
  className,
}: AchievementCardProps) {
  return (
    <Card className={cn(unlocked ? "" : "opacity-60", className)}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("rounded-full p-3", unlocked ? "bg-primary/10" : "bg-muted")}>
          {unlocked ? (
            <Trophy className="size-6 text-primary" />
          ) : (
            <Lock className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{name}</h3>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>
        <Badge variant="outline">+{xpReward} XP</Badge>
      </CardContent>
    </Card>
  )
}
