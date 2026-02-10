import { z } from "zod"

export const frontmatterSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["info", "code", "quiz"]),
  xp: z.number().min(10).max(50),
  difficulty: z.number().min(1).max(10),
  order: z.number().int().positive(),
  prerequisites: z.array(z.string()).default([]),
  hints: z.array(z.string()).default([]),
})

export const challengeTestSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["regex", "string-includes", "string-equals", "function-output"]),
  value: z.string(),
  args: z.array(z.unknown()).optional(),
  expected: z.unknown().optional(),
})

export const challengeSchema = z.object({
  id: z.string(),
  type: z.enum(["code-write", "code-fix", "fill-blank", "multiple-choice"]),
  language: z.enum(["ts", "tsx", "sql", "css", "json"]),
  starterCode: z.string(),
  solution: z.string(),
  tests: z.array(challengeTestSchema).min(1),
  setupCode: z.string().optional(),
})

export const chapterMetaSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number().int().positive(),
})

export const courseMetaSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
})

export type Frontmatter = z.infer<typeof frontmatterSchema>
export type ChapterMeta = z.infer<typeof chapterMetaSchema>
export type CourseMeta = z.infer<typeof courseMetaSchema>
