import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRight, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/courses/")({ component: CoursesPage })

function CoursesPage() {
  return (
    <main className="p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">Courses</h1>
        <p className="text-muted-foreground">Choose a course to start learning.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-3">
                <BookOpen className="size-6 text-primary" />
              </div>
              <div>
                <CardTitle>Build an E-Commerce Site</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Full-stack e-commerce platform</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">12 Chapters</Badge>
              <Badge variant="secondary">~92 Lessons</Badge>
              <Badge variant="secondary">2,000+ XP</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Learn to build a complete e-commerce platform like Indigo Sun Florals using TanStack Start, Drizzle ORM, Better Auth, and Stripe.
            </p>
            <Button asChild className="w-full">
              <Link to="/courses/build-ecommerce">
                View Course
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
