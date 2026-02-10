import { Link } from "@tanstack/react-router"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function ErrorFallback({ error, reset }: { error: Error; reset?: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          {reset && (
            <Button onClick={reset} variant="outline" size="sm">
              <RefreshCw className="size-4 mr-2" />
              Try again
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Go home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
