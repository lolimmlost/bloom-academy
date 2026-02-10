import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export const Route = createFileRoute("/search")({ component: SearchPage })

function SearchPage() {
  return (
    <main className="p-6 space-y-6 max-w-2xl mx-auto pb-20 md:pb-6">
      <h1 className="text-2xl font-bold">Search</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search lessons, chapters..." className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Search className="size-12 mx-auto mb-4 opacity-20" />
          <p>Start typing to search across all lessons and chapters.</p>
        </CardContent>
      </Card>
    </main>
  )
}
