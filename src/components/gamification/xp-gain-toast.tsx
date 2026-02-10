import { toast } from "sonner"
import { Sparkles } from "lucide-react"

export function showXPGainToast(xp: number, reason?: string) {
  toast(
    <div className="flex items-center gap-2">
      <Sparkles className="size-4 text-yellow-500" />
      <span className="font-semibold text-yellow-500">+{xp} XP</span>
      {reason && <span className="text-muted-foreground text-sm">{reason}</span>}
    </div>,
    {
      duration: 3000,
      position: "top-center",
    }
  )
}
