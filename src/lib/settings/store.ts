export interface AppSettings {
  // Editor
  editorFontSize: number
  editorTabSize: number
  editorLineNumbers: boolean
  editorWordWrap: boolean
  editorBracketMatching: boolean
  editorAutoCloseBrackets: boolean

  // Appearance
  theme: "light" | "dark" | "system"

  // Notifications
  showXPToasts: boolean
  showAchievementToasts: boolean
  showStreakReminders: boolean

  // Learning
  autoAdvance: boolean
  confirmLessonComplete: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  editorFontSize: 14,
  editorTabSize: 2,
  editorLineNumbers: true,
  editorWordWrap: false,
  editorBracketMatching: true,
  editorAutoCloseBrackets: true,
  theme: "system",
  showXPToasts: true,
  showAchievementToasts: true,
  showStreakReminders: true,
  autoAdvance: false,
  confirmLessonComplete: true,
}

const STORAGE_KEY = "bloom-academy-settings"

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // localStorage might be full or unavailable
  }
}
