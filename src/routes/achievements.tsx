import { createFileRoute } from "@tanstack/react-router"
import { Trophy, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useProgress } from "@/lib/progress/hooks"
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/gamification/achievements"

export const Route = createFileRoute("/achievements")({ component: AchievementsPage })

function AchievementsPage() {
  const { progress } = useProgress()

  return (
    <main className="p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-muted-foreground">
          {progress.unlockedAchievements.length} / {ACHIEVEMENT_DEFINITIONS.length} unlocked
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENT_DEFINITIONS.map((achievement) => {
          const unlocked = progress.unlockedAchievements.includes(achievement.key)

          return (
            <Card
              key={achievement.key}
              className={unlocked ? "" : "opacity-60"}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`rounded-full p-3 ${unlocked ? "bg-primary/10" : "bg-muted"}`}>
                  {unlocked ? (
                    <Trophy className="size-6 text-primary" />
                  ) : (
                    <Lock className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{achievement.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{achievement.description}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    +{achievement.xpReward} XP
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </main>
  )
}
