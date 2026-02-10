import { createFileRoute } from "@tanstack/react-router"
import { db } from "@/database/db"
import { lessonProgress, userProfiles, streakHistory, userAchievements, achievements } from "@/database/schema"
import { eq, and, sql } from "drizzle-orm"
import { getSession } from "@/lib/api/middleware"
import { completeLessonSchema } from "@/lib/api/schemas"
import { calculateXP } from "@/lib/gamification/xp"
import { getLevelForXP } from "@/lib/gamification/levels"

export const Route = createFileRoute("/api/progress/complete")({
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

        const parsed = completeLessonSchema.safeParse(body)
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Invalid data", details: parsed.error.flatten() }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        const data = parsed.data
        const userId = session.user.id

        // Get or create user profile
        let profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).then((r) => r[0])
        if (!profile) {
          const [newProfile] = await db.insert(userProfiles).values({ userId }).returning()
          profile = newProfile
        }

        // Check if lesson already completed
        const existing = await db
          .select()
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.userId, userId),
              eq(lessonProgress.courseId, data.courseId),
              eq(lessonProgress.chapterId, data.chapterId),
              eq(lessonProgress.lessonId, data.lessonId)
            )
          )
          .then((r) => r[0])

        if (existing?.status === "completed") {
          // Update last code but don't re-award XP
          await db
            .update(lessonProgress)
            .set({ lastCode: data.code, attempts: data.attempts })
            .where(eq(lessonProgress.id, existing.id))

          return new Response(
            JSON.stringify({ xpEarned: 0, achievementsUnlocked: [], streakUpdated: false }),
            { headers: { "Content-Type": "application/json" } }
          )
        }

        // Calculate XP
        const xpCalc = calculateXP({
          baseXP: 25,
          attempts: data.attempts,
          hintsUsed: data.hintsUsed,
          solutionViewed: data.solutionViewed,
          currentStreak: profile.currentStreak,
        })

        // Upsert lesson progress
        if (existing) {
          await db
            .update(lessonProgress)
            .set({
              status: "completed",
              xpEarned: xpCalc.total,
              attempts: data.attempts,
              hintsUsed: data.hintsUsed,
              solutionViewed: data.solutionViewed,
              lastCode: data.code,
              timeSpentSecs: data.timeSpentSecs,
              completedAt: new Date(),
            })
            .where(eq(lessonProgress.id, existing.id))
        } else {
          await db.insert(lessonProgress).values({
            userId,
            courseId: data.courseId,
            chapterId: data.chapterId,
            lessonId: data.lessonId,
            status: "completed",
            xpEarned: xpCalc.total,
            attempts: data.attempts,
            hintsUsed: data.hintsUsed,
            solutionViewed: data.solutionViewed,
            lastCode: data.code,
            timeSpentSecs: data.timeSpentSecs,
            completedAt: new Date(),
          })
        }

        // Update user profile XP
        const newTotalXP = profile.totalXP + xpCalc.total
        const newLevel = getLevelForXP(newTotalXP)

        // Update streak
        const today = new Date().toISOString().split("T")[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
        let newStreak = profile.currentStreak
        if (profile.lastActiveDate !== today) {
          newStreak = profile.lastActiveDate === yesterday ? profile.currentStreak + 1 : 1
        }

        await db
          .update(userProfiles)
          .set({
            totalXP: newTotalXP,
            level: newLevel.level,
            currentStreak: newStreak,
            longestStreak: Math.max(profile.longestStreak, newStreak),
            lastActiveDate: today,
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.id, profile.id))

        // Upsert streak history
        const existingStreak = await db
          .select()
          .from(streakHistory)
          .where(and(eq(streakHistory.userId, userId), eq(streakHistory.date, today)))
          .then((r) => r[0])

        if (existingStreak) {
          await db
            .update(streakHistory)
            .set({
              lessonsCompleted: existingStreak.lessonsCompleted + 1,
              xpEarned: existingStreak.xpEarned + xpCalc.total,
            })
            .where(eq(streakHistory.id, existingStreak.id))
        } else {
          await db.insert(streakHistory).values({
            userId,
            date: today,
            lessonsCompleted: 1,
            xpEarned: xpCalc.total,
          })
        }

        return new Response(
          JSON.stringify({
            xpEarned: xpCalc.total,
            newLevel: newLevel.level > profile.level ? newLevel : null,
            achievementsUnlocked: [],
            streakUpdated: newStreak !== profile.currentStreak,
          }),
          { headers: { "Content-Type": "application/json" } }
        )
      },
    },
  },
})
