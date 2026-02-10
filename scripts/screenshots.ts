import { chromium } from "@playwright/test"

const BASE_URL = "http://localhost:3000"
const SCREENSHOT_DIR = "/home/default/Desktop/dev/bloom-academy/screenshots"

const pages = [
  { name: "01-dashboard", path: "/", desc: "Dashboard" },
  { name: "02-courses", path: "/courses", desc: "Courses listing" },
  { name: "03-course-overview", path: "/courses/build-ecommerce", desc: "Course overview" },
  { name: "04-lesson-welcome", path: "/courses/build-ecommerce/ch01-foundations/01-welcome", desc: "Lesson: Welcome (info)" },
  { name: "05-lesson-code", path: "/courses/build-ecommerce/ch01-foundations/02-project-setup", desc: "Lesson: Project Setup (code)" },
  { name: "06-achievements", path: "/achievements", desc: "Achievements" },
  { name: "07-profile", path: "/profile", desc: "Profile" },
  { name: "08-search", path: "/search", desc: "Search" },
  { name: "09-settings", path: "/settings", desc: "Settings" },
  { name: "10-welcome", path: "/welcome", desc: "Welcome/Onboarding" },
  { name: "11-not-found", path: "/this-page-does-not-exist", desc: "404 Not Found" },
]

async function takeScreenshots() {
  const browser = await chromium.launch()

  // Desktop viewport
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  })
  const desktopPage = await desktopContext.newPage()

  console.log("\n--- Desktop Screenshots (1440x900, light mode) ---\n")
  for (const page of pages) {
    const url = `${BASE_URL}${page.path}`
    console.log(`  ${page.desc}: ${url}`)
    try {
      await desktopPage.goto(url, { waitUntil: "networkidle", timeout: 15000 })
      await desktopPage.waitForTimeout(1000) // let animations settle
      await desktopPage.screenshot({
        path: `${SCREENSHOT_DIR}/${page.name}-desktop.png`,
        fullPage: false,
      })
      console.log(`    -> saved ${page.name}-desktop.png`)
    } catch (e: any) {
      console.log(`    -> ERROR: ${e.message}`)
    }
  }

  // Dark mode desktop
  const darkContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  })
  const darkPage = await darkContext.newPage()

  console.log("\n--- Dark Mode Screenshots ---\n")
  const darkPages = [
    { name: "01-dashboard", path: "/", desc: "Dashboard (dark)" },
    { name: "04-lesson-welcome", path: "/courses/build-ecommerce/ch01-foundations/01-welcome", desc: "Lesson (dark)" },
  ]
  for (const page of darkPages) {
    const url = `${BASE_URL}${page.path}`
    console.log(`  ${page.desc}: ${url}`)
    try {
      await darkPage.goto(url, { waitUntil: "networkidle", timeout: 15000 })
      await darkPage.waitForTimeout(1000)
      await darkPage.screenshot({
        path: `${SCREENSHOT_DIR}/${page.name}-dark.png`,
        fullPage: false,
      })
      console.log(`    -> saved ${page.name}-dark.png`)
    } catch (e: any) {
      console.log(`    -> ERROR: ${e.message}`)
    }
  }

  // Mobile viewport
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
    isMobile: true,
  })
  const mobilePage = await mobileContext.newPage()

  console.log("\n--- Mobile Screenshots (390x844) ---\n")
  const mobilePages = [
    { name: "01-dashboard", path: "/", desc: "Dashboard (mobile)" },
    { name: "02-courses", path: "/courses", desc: "Courses (mobile)" },
    { name: "04-lesson-welcome", path: "/courses/build-ecommerce/ch01-foundations/01-welcome", desc: "Lesson (mobile)" },
    { name: "06-achievements", path: "/achievements", desc: "Achievements (mobile)" },
  ]
  for (const page of mobilePages) {
    const url = `${BASE_URL}${page.path}`
    console.log(`  ${page.desc}: ${url}`)
    try {
      await mobilePage.goto(url, { waitUntil: "networkidle", timeout: 15000 })
      await mobilePage.waitForTimeout(1000)
      await mobilePage.screenshot({
        path: `${SCREENSHOT_DIR}/${page.name}-mobile.png`,
        fullPage: false,
      })
      console.log(`    -> saved ${page.name}-mobile.png`)
    } catch (e: any) {
      console.log(`    -> ERROR: ${e.message}`)
    }
  }

  await browser.close()
  console.log("\nDone! Screenshots saved to:", SCREENSHOT_DIR)
}

takeScreenshots().catch(console.error)
