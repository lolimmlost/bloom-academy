import { createFileRoute } from "@tanstack/react-router"
import { Sparkles, Flame, BookOpen, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useProgress } from "@/lib/progress/hooks"

export const Route = createFileRoute("/profile")({ component: ProfilePage })

function ProfilePage() {
  const { progress, currentLevel, xpProgress } = useProgress()

  const completedLessons = Object.values(progress.lessons).filter(
    (l) => l.status === "completed"
  ).length

  return (
    <main className="p-6 space-y-6 max-w-3xl mx-auto pb-20 md:pb-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Level {currentLevel.level}: {currentLevel.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>{xpProgress.current} / {xpProgress.needed} XP to next level</span>
            <span>{xpProgress.percentage}%</span>
          </div>
          <Progress value={xpProgress.percentage} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Sparkles className="size-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">{progress.totalXP}</div>
            <p className="text-sm text-muted-foreground">Total XP</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Flame className="size-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{progress.currentStreak}</div>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="size-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{completedLessons}</div>
            <p className="text-sm text-muted-foreground">Lessons Done</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="size-8 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{progress.unlockedAchievements.length}</div>
            <p className="text-sm text-muted-foreground">Achievements</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
