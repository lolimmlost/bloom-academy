import { cn } from "@/lib/utils"

interface ActivityHeatmapProps {
  dates: string[] // dates with activity
  className?: string
}

export function ActivityHeatmap({ dates, className }: ActivityHeatmapProps) {
  // Generate last 90 days
  const days: { date: string; active: boolean }[] = []
  const today = new Date()

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    days.push({ date: dateStr, active: dates.includes(dateStr) })
  }

  // Group into weeks (columns)
  const weeks: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className={cn("flex gap-1", className)}>
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day) => (
            <div
              key={day.date}
              title={day.date}
              className={cn(
                "size-3 rounded-sm",
                day.active ? "bg-green-500" : "bg-muted"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
