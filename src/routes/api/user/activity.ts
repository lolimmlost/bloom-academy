import { createFileRoute } from "@tanstack/react-router"
import { db } from "@/database/db"
import { streakHistory } from "@/database/schema"
import { eq, desc } from "drizzle-orm"
import { getSession } from "@/lib/api/middleware"

export const Route = createFileRoute("/api/user/activity")({
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

        const activity = await db
          .select()
          .from(streakHistory)
          .where(eq(streakHistory.userId, session.user.id))
          .orderBy(desc(streakHistory.date))
          .limit(30)

        return new Response(JSON.stringify(activity), {
          headers: { "Content-Type": "application/json" },
        })
      },
    },
  },
})
