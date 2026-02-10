import { useState } from "react"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SolutionViewerProps {
  solution: string
  onViewed: () => void
}

export function SolutionViewer({ solution, onViewed }: SolutionViewerProps) {
  const [viewed, setViewed] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleView = () => {
    if (!viewed) {
      setViewed(true)
      onViewed()
    }
    setConfirmed(true)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="size-4 sm:mr-1" />
          <span className="hidden sm:inline">Solution</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>View Solution</DialogTitle>
          <DialogDescription>
            {!confirmed && (
              <Alert className="mt-2">
                <AlertDescription>
                  Viewing the solution will reduce your XP bonus for this lesson (-5 XP).
                  Are you sure?
                </AlertDescription>
              </Alert>
            )}
          </DialogDescription>
        </DialogHeader>

        {confirmed ? (
          <pre className="bg-muted rounded-lg p-4 overflow-auto text-sm max-h-96">
            <code>{solution}</code>
          </pre>
        ) : (
          <DialogFooter>
            <Button onClick={handleView}>Show Solution</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
