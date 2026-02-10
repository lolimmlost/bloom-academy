import { Link, useMatches } from "@tanstack/react-router"
import { BookOpen, Home, Search, Trophy, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Courses", url: "/courses", icon: BookOpen },
  { title: "Search", url: "/search", icon: Search },
  { title: "Achievements", url: "/achievements", icon: Trophy },
  { title: "Profile", url: "/profile", icon: User },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur md:hidden">
      <div className="flex h-16 items-center justify-around px-2 pb-safe">
        {navItems.map((item) => (
          <Link
            key={item.title}
            to={item.url}
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            activeProps={{ className: "text-primary font-medium" }}
          >
            <item.icon className="size-5" />
            <span>{item.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
