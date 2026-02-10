import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowRight, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/welcome")({ component: WelcomePage })

function WelcomePage() {
  const navigate = useNavigate()

  return (
    <main className="flex items-center justify-center min-h-[80vh] p-6">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-primary/10 rounded-full p-6 w-fit">
            <GraduationCap className="size-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Bloom Academy</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Learn to build a full-stack e-commerce site through interactive coding lessons.
            Write real code, earn XP, and level up your skills.
          </p>
          <Button
            className="w-full"
            onClick={() => navigate({ to: "/courses" })}
          >
            Start Learning
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
