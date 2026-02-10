import "dotenv/config"
import { drizzle } from "drizzle-orm/node-postgres"
import { achievements } from "./schema"

const db = drizzle(process.env.DATABASE_URL!)

const achievementData = [
  { key: "first-bloom", name: "First Bloom", description: "Complete your first lesson", icon: "Sprout", xpReward: 10, criteria: { type: "lessons_completed", count: 1 } },
  { key: "chapter-champion", name: "Chapter Champion", description: "Complete an entire chapter", icon: "Trophy", xpReward: 50, criteria: { type: "chapter_completed", count: 1 } },
  { key: "week-warrior", name: "Week Warrior", description: "Maintain a 7-day streak", icon: "Flame", xpReward: 25, criteria: { type: "streak", days: 7 } },
  { key: "monthly-devotee", name: "Monthly Devotee", description: "Maintain a 30-day streak", icon: "Calendar", xpReward: 100, criteria: { type: "streak", days: 30 } },
  { key: "independent-mind", name: "Independent Mind", description: "Complete 10 lessons without hints", icon: "Brain", xpReward: 30, criteria: { type: "no_hints", count: 10 } },
  { key: "sharp-coder", name: "Sharp Coder", description: "Complete 10 lessons on the first try", icon: "Zap", xpReward: 30, criteria: { type: "first_try", count: 10 } },
  { key: "schema-master", name: "Schema Master", description: "Complete the Database chapter", icon: "Database", xpReward: 50, criteria: { type: "chapter_completed", chapterId: "ch02-database" } },
  { key: "gatekeeper", name: "Gatekeeper", description: "Complete the Authentication chapter", icon: "Shield", xpReward: 50, criteria: { type: "chapter_completed", chapterId: "ch03-authentication" } },
  { key: "cart-builder", name: "Cart Builder", description: "Complete the Shopping Cart chapter", icon: "ShoppingCart", xpReward: 50, criteria: { type: "chapter_completed", chapterId: "ch05-shopping-cart" } },
  { key: "money-mover", name: "Money Mover", description: "Complete the Payments chapter", icon: "CreditCard", xpReward: 50, criteria: { type: "chapter_completed", chapterId: "ch06-checkout-payments" } },
  { key: "admin-elite", name: "Admin Elite", description: "Complete the Admin Dashboard chapter", icon: "LayoutDashboard", xpReward: 50, criteria: { type: "chapter_completed", chapterId: "ch10-admin-dashboard" } },
  { key: "test-driven", name: "Test Driven", description: "Complete the Testing chapter", icon: "FlaskConical", xpReward: 50, criteria: { type: "chapter_completed", chapterId: "ch11-testing-quality" } },
  { key: "speed-runner", name: "Speed Runner", description: "Complete a lesson in under 60 seconds", icon: "Timer", xpReward: 20, criteria: { type: "speed_complete", seconds: 60 } },
  { key: "perfectionist", name: "Perfectionist", description: "Complete a chapter with all first-try bonuses", icon: "Star", xpReward: 75, criteria: { type: "perfect_chapter" } },
  { key: "platform-master", name: "Platform Master", description: "Complete the entire course", icon: "Crown", xpReward: 200, criteria: { type: "course_completed" } },
]

async function seed() {
  console.log("Seeding achievements...")
  for (const data of achievementData) {
    await db.insert(achievements).values(data).onConflictDoNothing()
  }
  console.log(`Seeded ${achievementData.length} achievements`)
  process.exit(0)
}

seed().catch((e) => {
  console.error("Seed failed:", e)
  process.exit(1)
})
