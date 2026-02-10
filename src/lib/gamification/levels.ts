export interface LevelInfo {
  level: number
  title: string
  xpRequired: number
  xpForNext: number | null
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: "Seedling", xpRequired: 0, xpForNext: 100 },
  { level: 2, title: "Sprout", xpRequired: 100, xpForNext: 250 },
  { level: 3, title: "Budding Dev", xpRequired: 250, xpForNext: 500 },
  { level: 4, title: "Bloom Apprentice", xpRequired: 500, xpForNext: 800 },
  { level: 5, title: "Garden Keeper", xpRequired: 800, xpForNext: 1200 },
  { level: 6, title: "Flower Crafter", xpRequired: 1200, xpForNext: 1700 },
  { level: 7, title: "Arrangement Artist", xpRequired: 1700, xpForNext: 2400 },
  { level: 8, title: "Bouquet Builder", xpRequired: 2400, xpForNext: 3200 },
  { level: 9, title: "Shop Manager", xpRequired: 3200, xpForNext: 4200 },
  { level: 10, title: "E-Commerce Architect", xpRequired: 4200, xpForNext: 5500 },
  { level: 11, title: "Full-Stack Florist", xpRequired: 5500, xpForNext: 7000 },
  { level: 12, title: "Platform Master", xpRequired: 7000, xpForNext: null },
]

export function getLevelForXP(totalXP: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xpRequired) {
      return LEVELS[i]
    }
  }
  return LEVELS[0]
}

export function getXPProgress(totalXP: number): { current: number; needed: number; percentage: number } {
  const level = getLevelForXP(totalXP)
  if (level.xpForNext === null) {
    return { current: totalXP - level.xpRequired, needed: 0, percentage: 100 }
  }
  const xpIntoLevel = totalXP - level.xpRequired
  const xpNeeded = level.xpForNext - level.xpRequired
  return {
    current: xpIntoLevel,
    needed: xpNeeded,
    percentage: Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100)),
  }
}

export function checkLevelUp(oldXP: number, newXP: number): LevelInfo | null {
  const oldLevel = getLevelForXP(oldXP)
  const newLevel = getLevelForXP(newXP)
  if (newLevel.level > oldLevel.level) {
    return newLevel
  }
  return null
}
