import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { frontmatterSchema, courseMetaSchema, chapterMetaSchema } from "../src/lib/content/schemas"

const CONTENT_DIR = path.resolve(process.cwd(), "content/courses")
let errors: string[] = []
let warnings: string[] = []

function validate() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log("No content directory found, skipping validation")
    process.exit(0)
  }

  const courseDirs = fs.readdirSync(CONTENT_DIR).filter((d) =>
    fs.statSync(path.join(CONTENT_DIR, d)).isDirectory()
  )

  for (const courseDir of courseDirs) {
    validateCourse(path.join(CONTENT_DIR, courseDir), courseDir)
  }

  if (warnings.length > 0) {
    console.log(`\n⚠ ${warnings.length} warning(s):`)
    warnings.forEach((w) => console.log(`  - ${w}`))
  }

  if (errors.length > 0) {
    console.log(`\n✗ ${errors.length} error(s):`)
    errors.forEach((e) => console.log(`  - ${e}`))
    process.exit(1)
  }

  console.log("\n✓ All content is valid!")
}

function validateCourse(coursePath: string, dirName: string) {
  const courseJsonPath = path.join(coursePath, "course.json")
  if (!fs.existsSync(courseJsonPath)) {
    errors.push(`${dirName}: missing course.json`)
    return
  }

  try {
    const data = JSON.parse(fs.readFileSync(courseJsonPath, "utf-8"))
    courseMetaSchema.parse(data)
  } catch (e: any) {
    errors.push(`${dirName}/course.json: ${e.message}`)
  }

  const chapterDirs = fs.readdirSync(coursePath)
    .filter((d) => d.startsWith("ch") && fs.statSync(path.join(coursePath, d)).isDirectory())
    .sort()

  const allIds = new Set<string>()

  for (const chapterDir of chapterDirs) {
    validateChapter(path.join(coursePath, chapterDir), `${dirName}/${chapterDir}`, allIds)
  }
}

function validateChapter(chapterPath: string, prefix: string, allIds: Set<string>) {
  const chapterJsonPath = path.join(chapterPath, "chapter.json")
  if (!fs.existsSync(chapterJsonPath)) {
    errors.push(`${prefix}: missing chapter.json`)
    return
  }

  try {
    const data = JSON.parse(fs.readFileSync(chapterJsonPath, "utf-8"))
    chapterMetaSchema.parse(data)
  } catch (e: any) {
    errors.push(`${prefix}/chapter.json: ${e.message}`)
  }

  const mdFiles = fs.readdirSync(chapterPath).filter((f) => f.endsWith(".md")).sort()
  let expectedOrder = 1

  for (const file of mdFiles) {
    const raw = fs.readFileSync(path.join(chapterPath, file), "utf-8")
    const { data } = matter(raw)

    try {
      const parsed = frontmatterSchema.parse(data)
      if (allIds.has(parsed.id)) {
        errors.push(`${prefix}/${file}: duplicate lesson id "${parsed.id}"`)
      }
      allIds.add(parsed.id)

      if (parsed.order !== expectedOrder) {
        warnings.push(`${prefix}/${file}: expected order ${expectedOrder}, got ${parsed.order}`)
      }
      expectedOrder++

      // Check challenge file exists for code type
      if (parsed.type === "code") {
        const challengeDir = path.join(chapterPath, "challenges")
        const challengeFile = `${parsed.id}.challenge.json`
        if (!fs.existsSync(path.join(challengeDir, challengeFile))) {
          warnings.push(`${prefix}/${file}: code lesson missing challenge file "${challengeFile}"`)
        }
      }
    } catch (e: any) {
      errors.push(`${prefix}/${file}: ${e.message}`)
    }
  }
}

validate()
