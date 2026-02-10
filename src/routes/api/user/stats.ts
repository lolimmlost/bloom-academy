import { createFileRoute } from "@tanstack/react-router"
import { db } from "@/database/db"
import { userProfiles, lessonProgress, userAchievements } from "@/database/schema"
import { eq, count } from "drizzle-orm"
import { getSession } from "@/lib/api/middleware"

export const Route = createFileRoute("/api/user/stats")({
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

        const userId = session.user.id

        const profile = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .then((r) => r[0])

        const [lessonsCount] = await db
          .select({ count: count() })
          .from(lessonProgress)
          .where(eq(lessonProgress.userId, userId))

        const [achievementCount] = await db
          .select({ count: count() })
          .from(userAchievements)
          .where(eq(userAchievements.userId, userId))

        return new Response(
          JSON.stringify({
            totalXP: profile?.totalXP ?? 0,
            level: profile?.level ?? 1,
            currentStreak: profile?.currentStreak ?? 0,
            longestStreak: profile?.longestStreak ?? 0,
            lessonsCompleted: lessonsCount?.count ?? 0,
            achievementsUnlocked: achievementCount?.count ?? 0,
          }),
          { headers: { "Content-Type": "application/json" } }
        )
      },
    },
  },
})
