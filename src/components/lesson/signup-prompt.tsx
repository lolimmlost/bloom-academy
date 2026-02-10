import { Link } from "@tanstack/react-router"
import { Shield, CloudUpload, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface SignupPromptProps {
  open: boolean
  onClose: () => void
}

export function SignupPrompt({ open, onClose }: SignupPromptProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl">Create an account</DialogTitle>
          <DialogDescription>
            Your progress is saved locally. Create a free account to keep it safe.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="flex items-start gap-3">
            <CloudUpload className="size-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Sync across devices</p>
              <p className="text-xs text-muted-foreground">Pick up where you left off on any device.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="size-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Never lose progress</p>
              <p className="text-xs text-muted-foreground">Your XP, streaks, and completed lessons are backed up.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Trophy className="size-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Unlock achievements</p>
              <p className="text-xs text-muted-foreground">Track your full learning journey and earn badges.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button asChild>
            <Link to="/auth/$path" params={{ path: "sign-up" }}>
              Create free account
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
