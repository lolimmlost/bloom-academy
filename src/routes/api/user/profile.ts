import { createFileRoute } from "@tanstack/react-router"
import { db } from "@/database/db"
import { userProfiles } from "@/database/schema"
import { eq } from "drizzle-orm"
import { getSession } from "@/lib/api/middleware"
import { updateProfileSchema } from "@/lib/api/schemas"

export const Route = createFileRoute("/api/user/profile")({
  server: {
    handlers: {
      PUT: async ({ request }) => {
        const session = await getSession(request)
        if (!session) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          })
        }

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        const parsed = updateProfileSchema.safeParse(body)
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Invalid data" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        const userId = session.user.id
        const data = parsed.data

        let profile = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .then((r) => r[0])

        if (!profile) {
          const [newProfile] = await db
            .insert(userProfiles)
            .values({ userId, ...data })
            .returning()
          profile = newProfile
        } else {
          const [updated] = await db
            .update(userProfiles)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(userProfiles.id, profile.id))
            .returning()
          profile = updated
        }

        return new Response(JSON.stringify(profile), {
          headers: { "Content-Type": "application/json" },
        })
      },
    },
  },
})
