import { Link } from "@tanstack/react-router"
import { Flower2, Home, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <Flower2 className="size-16 text-muted-foreground mb-4" />
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-6">
        This page hasn't bloomed yet.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/">
            <Home className="size-4 mr-2" />
            Dashboard
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/courses">
            <Search className="size-4 mr-2" />
            Browse Courses
          </Link>
        </Button>
      </div>
    </div>
  )
}
