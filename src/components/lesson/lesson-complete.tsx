import { Sparkles, ArrowRight, Trophy, CheckCircle2, PartyPopper } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { AchievementDef } from "@/lib/gamification/achievements"
import type { LevelInfo } from "@/lib/gamification/levels"

interface LessonCompleteProps {
  open: boolean
  onClose: () => void
  xpEarned: number
  newLevel?: LevelInfo | null
  achievementsUnlocked: AchievementDef[]
  onNextLesson?: () => void
  onBackToCourse?: () => void
}

export function LessonComplete({
  open,
  onClose,
  xpEarned,
  newLevel,
  achievementsUnlocked,
  onNextLesson,
  onBackToCourse,
}: LessonCompleteProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="text-center max-w-md">
        <DialogHeader className="space-y-3">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/10 p-4">
              <CheckCircle2 className="size-12 text-green-500" />
            </div>
          </div>
          <DialogTitle className="text-2xl">Congratulations!</DialogTitle>
          <DialogDescription className="text-base">
            You've successfully completed this lesson. Keep up the great work!
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-yellow-500/10 rounded-xl py-4 px-6 inline-flex items-center gap-3 mx-auto">
            <Sparkles className="size-7 text-yellow-500" />
            <span className="text-3xl font-bold text-yellow-500">+{xpEarned} XP</span>
          </div>

          {newLevel && (
            <div className="bg-primary/10 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <PartyPopper className="size-5 text-primary" />
                <p className="text-lg font-semibold">Level Up!</p>
              </div>
              <p className="text-muted-foreground">
                You've reached <span className="font-medium text-foreground">Level {newLevel.level}: {newLevel.title}</span>
              </p>
            </div>
          )}

          {achievementsUnlocked.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Achievements Unlocked</p>
              {achievementsUnlocked.map((a) => (
                <div key={a.key} className="flex items-center gap-3 justify-center bg-muted/50 rounded-lg py-2 px-4">
                  <Trophy className="size-5 text-yellow-500" />
                  <span className="font-medium">{a.name}</span>
                  <Badge variant="secondary">+{a.xpReward} XP</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Review Lesson
          </Button>
          {onNextLesson ? (
            <Button onClick={onNextLesson}>
              Next Lesson
              <ArrowRight className="size-4 ml-2" />
            </Button>
          ) : onBackToCourse ? (
            <Button onClick={onBackToCourse}>
              Back to Course
              <ArrowRight className="size-4 ml-2" />
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
