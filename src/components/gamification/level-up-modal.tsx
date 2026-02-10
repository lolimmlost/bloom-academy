import { GraduationCap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { LevelInfo } from "@/lib/gamification/levels"

interface LevelUpModalProps {
  open: boolean
  onClose: () => void
  level: LevelInfo
}

export function LevelUpModal({ open, onClose, level }: LevelUpModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-center gap-2">
            <Sparkles className="size-6 text-yellow-500" />
            Level Up!
            <Sparkles className="size-6 text-yellow-500" />
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="size-10 text-primary" />
          </div>

          <div>
            <p className="text-4xl font-bold">Level {level.level}</p>
            <p className="text-lg text-muted-foreground">{level.title}</p>
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  )
}
