import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { randomUUID } from "node:crypto"

export const users = pgTable("users", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull()
})

export const sessions = pgTable("sessions", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" })
})

export const accounts = pgTable("accounts", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull()
})

export const verifications = pgTable("verifications", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at")
})

// ── App tables ──────────────────────────────────────────────

export const userProfiles = pgTable("user_profiles", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id")
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    totalXP: integer("total_xp").notNull().default(0),
    level: integer("level").notNull().default(1),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastActiveDate: text("last_active_date"),
    editorFontSize: integer("editor_font_size"),
    editorTabSize: integer("editor_tab_size"),
    soundEnabled: boolean("sound_enabled"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const lessonProgress = pgTable("lesson_progress", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull(),
    chapterId: text("chapter_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    status: text("status").notNull().default("not-started"),
    xpEarned: integer("xp_earned").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    hintsUsed: integer("hints_used").notNull().default(0),
    solutionViewed: boolean("solution_viewed").notNull().default(false),
    lastCode: text("last_code"),
    timeSpentSecs: integer("time_spent_secs").notNull().default(0),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const streakHistory = pgTable("streak_history", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    lessonsCompleted: integer("lessons_completed").notNull().default(0),
    xpEarned: integer("xp_earned").notNull().default(0),
})

export const achievements = pgTable("achievements", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    key: text("key").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    icon: text("icon").notNull(),
    xpReward: integer("xp_reward").notNull().default(0),
    criteria: jsonb("criteria").notNull(),
})

export const userAchievements = pgTable("user_achievements", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    achievementKey: text("achievement_key")
        .notNull()
        .references(() => achievements.key),
    unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
})
