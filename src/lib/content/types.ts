type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export interface Course {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  totalLessons: number
  totalXP: number
  chapters: Chapter[]
}

export interface Chapter {
  id: string
  slug: string
  title: string
  description: string
  order: number
  lessons: LessonMeta[]
}

export interface LessonMeta {
  id: string
  slug: string
  title: string
  type: "info" | "code" | "quiz"
  xp: number
  difficulty: number
  order: number
  prerequisites: string[]
  hints: string[]
  chapterId: string
  courseId: string
}

export interface LessonContent extends LessonMeta {
  body: string // markdown content
  challenge?: Challenge
  quizQuestions?: QuizQuestion[]
}

export interface Challenge {
  id: string
  type: "code-write" | "code-fix" | "fill-blank" | "multiple-choice"
  language: "ts" | "tsx" | "sql" | "css" | "json"
  starterCode: string
  solution: string
  tests: ChallengeTest[]
  setupCode?: string
  completions?: ChallengeCompletion[]
}

export interface ChallengeCompletion {
  label: string
  type?: "function" | "variable" | "keyword" | "property" | "text"
  detail?: string
  template?: string
}

export interface ChallengeTest {
  id: string
  label: string
  type: "regex" | "string-includes" | "string-equals" | "function-output"
  value: string
  args?: JsonValue[]
  expected?: JsonValue
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}
