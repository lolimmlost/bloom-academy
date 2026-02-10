import { createFileRoute } from "@tanstack/react-router"
import { db } from "@/database/db"
import { lessonProgress, userProfiles } from "@/database/schema"
import { eq, and } from "drizzle-orm"
import { getSession } from "@/lib/api/middleware"
import { syncProgressSchema } from "@/lib/api/schemas"
import { getLevelForXP } from "@/lib/gamification/levels"

export const Route = createFileRoute("/api/progress/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
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

        const parsed = syncProgressSchema.safeParse(body)
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Invalid data" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        const userId = session.user.id
        const localProgress = parsed.data.progress
        let totalXPMerged = 0

        for (const item of localProgress) {
          const existing = await db
            .select()
            .from(lessonProgress)
            .where(
              and(
                eq(lessonProgress.userId, userId),
                eq(lessonProgress.courseId, item.courseId),
                eq(lessonProgress.chapterId, item.chapterId),
                eq(lessonProgress.lessonId, item.lessonId)
              )
            )
            .then((r) => r[0])

          if (!existing) {
            await db.insert(lessonProgress).values({
              userId,
              courseId: item.courseId,
              chapterId: item.chapterId,
              lessonId: item.lessonId,
              status: item.status,
              xpEarned: item.xpEarned,
              attempts: item.attempts,
              hintsUsed: item.hintsUsed,
              solutionViewed: item.solutionViewed,
              lastCode: item.lastCode,
              timeSpentSecs: item.timeSpentSecs,
              completedAt: item.completedAt ? new Date(item.completedAt) : null,
            })
            totalXPMerged += item.xpEarned
          } else {
            // Merge: keep completed if either is completed, keep max XP
            const mergedStatus =
              item.status === "completed" || existing.status === "completed"
                ? "completed"
                : item.status === "in-progress" || existing.status === "in-progress"
                  ? "in-progress"
                  : "not-started"
            const mergedXP = Math.max(item.xpEarned, existing.xpEarned)

            await db
              .update(lessonProgress)
              .set({
                status: mergedStatus,
                xpEarned: mergedXP,
                attempts: Math.max(item.attempts, existing.attempts),
                lastCode: item.lastCode ?? existing.lastCode,
                completedAt: item.completedAt
                  ? new Date(item.completedAt)
                  : existing.completedAt,
              })
              .where(eq(lessonProgress.id, existing.id))

            totalXPMerged += mergedXP - existing.xpEarned
          }
        }

        // Update profile XP
        let profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).then((r) => r[0])
        if (!profile) {
          await db.insert(userProfiles).values({ userId, totalXP: totalXPMerged, level: getLevelForXP(totalXPMerged).level })
        } else if (totalXPMerged > 0) {
          const newXP = profile.totalXP + totalXPMerged
          await db
            .update(userProfiles)
            .set({ totalXP: newXP, level: getLevelForXP(newXP).level, updatedAt: new Date() })
            .where(eq(userProfiles.id, profile.id))
        }

        // Return merged progress
        const allProgress = await db
          .select()
          .from(lessonProgress)
          .where(eq(lessonProgress.userId, userId))

        return new Response(JSON.stringify({ progress: allProgress }), {
          headers: { "Content-Type": "application/json" },
        })
      },
    },
  },
})
