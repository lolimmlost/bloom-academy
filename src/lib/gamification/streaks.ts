export function calculateStreak(dates: string[]): { currentStreak: number; longestStreak: number } {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 }

  const sorted = [...dates].sort((a, b) => b.localeCompare(a)) // newest first
  const today = new Date().toISOString().split("T")[0]

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1

  // Check if the most recent date is today or yesterday
  const mostRecent = sorted[0]
  const daysDiff = daysBetween(mostRecent, today)
  if (daysDiff > 1) {
    // streak is broken
    currentStreak = 0
  } else {
    currentStreak = 1
  }

  for (let i = 1; i < sorted.length; i++) {
    const diff = daysBetween(sorted[i], sorted[i - 1])
    if (diff === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  if (daysDiff <= 1) {
    // Recount current streak from newest
    currentStreak = 1
    for (let i = 1; i < sorted.length; i++) {
      const diff = daysBetween(sorted[i], sorted[i - 1])
      if (diff === 1) {
        currentStreak++
      } else {
        break
      }
    }
  }

  return { currentStreak, longestStreak }
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA)
  const b = new Date(dateB)
  const diff = Math.abs(b.getTime() - a.getTime())
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

export function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split("T")[0]
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]
}
