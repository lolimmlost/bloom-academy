import { createFileRoute } from "@tanstack/react-router"
import { db } from "@/database/db"
import { lessonProgress } from "@/database/schema"
import { eq } from "drizzle-orm"
import { getSession } from "@/lib/api/middleware"

export const Route = createFileRoute("/api/progress/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await getSession(request)
        if (!session) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          })
        }

        const progress = await db
          .select()
          .from(lessonProgress)
          .where(eq(lessonProgress.userId, session.user.id))

        return new Response(JSON.stringify(progress), {
          headers: { "Content-Type": "application/json" },
        })
      },
    },
  },
})
