import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Search, Code, Info, FileText, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SearchItem {
  lessonId: string
  lessonTitle: string
  lessonSlug: string
  lessonType: "info" | "code" | "quiz"
  chapterTitle: string
  chapterSlug: string
  courseTitle: string
  courseSlug: string
  xp: number
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: SearchItem[]
}

const typeIcons = {
  info: Info,
  code: Code,
  quiz: FileText,
} as const

export function SearchDialog({ open, onOpenChange, items }: SearchDialogProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    if (!query.trim()) return items.slice(0, 10)
    const lower = query.toLowerCase()
    return items.filter(
      (item) =>
        item.lessonTitle.toLowerCase().includes(lower) ||
        item.chapterTitle.toLowerCase().includes(lower) ||
        item.courseTitle.toLowerCase().includes(lower)
    ).slice(0, 10)
  }, [query, items])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setSelectedIndex(0)
    }
  }, [open])

  const goToResult = useCallback((item: SearchItem) => {
    onOpenChange(false)
    navigate({
      to: "/courses/$courseSlug/$chapterSlug/$lessonSlug",
      params: {
        courseSlug: item.courseSlug,
        chapterSlug: item.chapterSlug,
        lessonSlug: item.lessonSlug,
      },
    })
  }, [navigate, onOpenChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      goToResult(results[selectedIndex])
    }
  }, [results, selectedIndex, goToResult])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Search lessons</DialogTitle>
        <div className="flex items-center border-b px-3">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search lessons..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 shadow-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground shrink-0">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-72 overflow-y-auto p-1">
          {results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No lessons found.
            </div>
          ) : (
            results.map((item, i) => {
              const Icon = typeIcons[item.lessonType] ?? Info
              return (
                <button
                  key={`${item.courseSlug}-${item.chapterSlug}-${item.lessonSlug}`}
                  onClick={() => goToResult(item)}
                  className={`flex items-center gap-3 w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    i === selectedIndex ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  <Icon className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{item.lessonTitle}</span>
                    <span className="text-xs text-muted-foreground truncate block">
                      {item.chapterTitle}
                    </span>
                  </div>
                  <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                </button>
              )
            })
          )}
        </div>

        <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium">
              &uarr;&darr;
            </kbd>
            <span>Navigate</span>
            <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium">
              &crarr;
            </kbd>
            <span>Open</span>
          </div>
          <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={() => {
            onOpenChange(false)
            navigate({ to: "/search" })
          }}>
            Full search
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
