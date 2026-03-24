import { useState, useEffect } from "react"
import { Link } from "@tanstack/react-router"
import { UserButton } from "@daveyplate/better-auth-ui"
import { Flame, Search, Sparkles } from "lucide-react"

import { ModeToggle } from "@/components/mode-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useProgress } from "@/lib/progress/hooks"
import { SearchDialog } from "./search-dialog"
import { loadSearchNav } from "@/lib/content/search-index"

type SearchItem = Awaited<ReturnType<typeof loadSearchNav>>[number]

export function AppHeader() {
  const { progress, currentLevel, xpProgress } = useProgress()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchItems, setSearchItems] = useState<SearchItem[]>([])

  // Load search items via server function on first open
  useEffect(() => {
    if (searchOpen && searchItems.length === 0) {
      loadSearchNav().then(setSearchItems).catch(() => {})
    }
  }, [searchOpen, searchItems.length])

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        <div className="flex flex-1 items-center gap-4">
          <Link to="/" className="font-semibold text-sm hidden md:block">
            Bloom Academy
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-2 text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-3.5" />
            <span className="text-xs">Search...</span>
            <kbd className="ml-2 inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-4" />
          </Button>

          {/* Streak */}
          <div className="flex items-center gap-1 text-sm">
            <Flame className="size-4 text-orange-500" />
            <span className="font-medium">{progress.currentStreak}</span>
          </div>

          {/* XP / Level */}
          <div className="hidden sm:flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3" />
              Lv. {currentLevel.level}
            </Badge>
            <div className="flex items-center gap-2 w-24">
              <Progress value={xpProgress.percentage} className="h-2" />
            </div>
            <span className="text-xs text-muted-foreground">
              {progress.totalXP} XP
            </span>
          </div>

          <ModeToggle />
          <UserButton size="icon" />
        </div>
      </header>

      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        items={searchItems}
      />
    </>
  )
}
