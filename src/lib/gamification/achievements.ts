export interface AchievementDef {
  key: string
  name: string
  description: string
  icon: string
  xpReward: number
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  { key: "first-bloom", name: "First Bloom", description: "Complete your first lesson", icon: "Sprout", xpReward: 10 },
  { key: "chapter-champion", name: "Chapter Champion", description: "Complete an entire chapter", icon: "Trophy", xpReward: 50 },
  { key: "week-warrior", name: "Week Warrior", description: "Maintain a 7-day streak", icon: "Flame", xpReward: 25 },
  { key: "monthly-devotee", name: "Monthly Devotee", description: "Maintain a 30-day streak", icon: "Calendar", xpReward: 100 },
  { key: "independent-mind", name: "Independent Mind", description: "Complete 10 lessons without hints", icon: "Brain", xpReward: 30 },
  { key: "sharp-coder", name: "Sharp Coder", description: "Complete 10 lessons on the first try", icon: "Zap", xpReward: 30 },
  { key: "schema-master", name: "Schema Master", description: "Complete the Database chapter", icon: "Database", xpReward: 50 },
  { key: "gatekeeper", name: "Gatekeeper", description: "Complete the Authentication chapter", icon: "Shield", xpReward: 50 },
  { key: "cart-builder", name: "Cart Builder", description: "Complete the Shopping Cart chapter", icon: "ShoppingCart", xpReward: 50 },
  { key: "money-mover", name: "Money Mover", description: "Complete the Payments chapter", icon: "CreditCard", xpReward: 50 },
  { key: "admin-elite", name: "Admin Elite", description: "Complete the Admin Dashboard chapter", icon: "LayoutDashboard", xpReward: 50 },
  { key: "test-driven", name: "Test Driven", description: "Complete the Testing chapter", icon: "FlaskConical", xpReward: 50 },
  { key: "speed-runner", name: "Speed Runner", description: "Complete a lesson in under 60 seconds", icon: "Timer", xpReward: 20 },
  { key: "perfectionist", name: "Perfectionist", description: "Complete a chapter with all first-try bonuses", icon: "Star", xpReward: 75 },
  { key: "platform-master", name: "Platform Master", description: "Complete the entire course", icon: "Crown", xpReward: 200 },
]

export interface CheckAchievementContext {
  totalLessonsCompleted: number
  totalNoHintLessons: number
  totalFirstTryLessons: number
  currentStreak: number
  completedChapterIds: string[]
  courseCompleted: boolean
  lessonTimeSeconds: number
  chapterPerfect: boolean // all first-try in this chapter
  unlockedAchievements: string[] // already unlocked keys
}

export function checkNewAchievements(ctx: CheckAchievementContext): AchievementDef[] {
  const newlyUnlocked: AchievementDef[] = []
  const check = (key: string, condition: boolean) => {
    if (condition && !ctx.unlockedAchievements.includes(key)) {
      const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.key === key)
      if (def) newlyUnlocked.push(def)
    }
  }

  check("first-bloom", ctx.totalLessonsCompleted >= 1)
  check("chapter-champion", ctx.completedChapterIds.length >= 1)
  check("week-warrior", ctx.currentStreak >= 7)
  check("monthly-devotee", ctx.currentStreak >= 30)
  check("independent-mind", ctx.totalNoHintLessons >= 10)
  check("sharp-coder", ctx.totalFirstTryLessons >= 10)
  check("schema-master", ctx.completedChapterIds.includes("ch02-database"))
  check("gatekeeper", ctx.completedChapterIds.includes("ch03-authentication"))
  check("cart-builder", ctx.completedChapterIds.includes("ch05-shopping-cart"))
  check("money-mover", ctx.completedChapterIds.includes("ch06-checkout-payments"))
  check("admin-elite", ctx.completedChapterIds.includes("ch10-admin-dashboard"))
  check("test-driven", ctx.completedChapterIds.includes("ch11-testing-quality"))
  check("speed-runner", ctx.lessonTimeSeconds > 0 && ctx.lessonTimeSeconds < 60)
  check("perfectionist", ctx.chapterPerfect)
  check("platform-master", ctx.courseCompleted)

  return newlyUnlocked
}
