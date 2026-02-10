import { useState } from "react"
import { Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface HintButtonProps {
  hints: string[]
  onHintUsed: () => void
}

export function HintButton({ hints, onHintUsed }: HintButtonProps) {
  const [revealedCount, setRevealedCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const handleRevealNext = () => {
    if (revealedCount < hints.length) {
      setRevealedCount((prev) => prev + 1)
      onHintUsed()
    }
  }

  if (hints.length === 0) return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm">
          <Lightbulb className="size-4 sm:mr-1" />
          <span className="hidden sm:inline">Hints ({revealedCount}/{hints.length})</span>
          <span className="sm:hidden">{revealedCount}/{hints.length}</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="absolute bottom-full right-0 mb-2 w-[calc(100vw-2rem)] sm:w-80 z-10">
        <div className="bg-background border rounded-lg p-4 shadow-lg space-y-2">
          {hints.slice(0, revealedCount).map((hint, i) => (
            <Alert key={i}>
              <Lightbulb className="size-4" />
              <AlertDescription>{hint}</AlertDescription>
            </Alert>
          ))}
          {revealedCount < hints.length && (
            <Button
              onClick={handleRevealNext}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Reveal hint {revealedCount + 1}
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
