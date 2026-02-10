import { useState, useMemo } from "react"

interface SearchableItem {
  id: string
  title: string
  type: string
  courseId: string
  chapterId: string
  slug: string
}

export function useSearch(items: SearchableItem[]) {
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    if (!query.trim()) return []
    const lower = query.toLowerCase()
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.type.toLowerCase().includes(lower)
    )
  }, [query, items])

  return { query, setQuery, results }
}
