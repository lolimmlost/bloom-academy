import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useTheme } from "next-themes"
import { RotateCcw, Trash2, Monitor, Sun, Moon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CodeEditor } from "@/components/lesson/code-editor"
import { useSettings } from "@/lib/settings/context"
import { useProgress } from "@/lib/progress/hooks"
import { clearProgress } from "@/lib/progress/store"
import { cn } from "@/lib/utils"

const PREVIEW_CODE = `import express from "express"

const app = express()
app.use(express.json())

interface Product {
  id: number
  name: string
  price: number
  inStock: boolean
}

const products: Product[] = [
  { id: 1, name: "Wireless Headphones", price: 79.99, inStock: true },
  { id: 2, name: "USB-C Cable", price: 12.99, inStock: true },
  { id: 3, name: "Laptop Stand", price: 45.00, inStock: false },
]

app.get("/api/products", (req, res) => {
  const available = req.query.inStock === "true"
    ? products.filter((p) => p.inStock)
    : products
  res.json(available)
})

app.listen(3000, () => {
  console.log("Server running on port 3000")
})
`

export const Route = createFileRoute("/settings")({ component: SettingsPage })

function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings()
  const { progress, updateProgress } = useProgress()
  const { theme, setTheme } = useTheme()
  const [previewCode, setPreviewCode] = useState(PREVIEW_CODE)
  const [resetOpen, setResetOpen] = useState(false)

  const completedCount = Object.values(progress.lessons).filter(
    (l) => l.status === "completed"
  ).length

  const handleResetProgress = () => {
    clearProgress()
    updateProgress(() => ({
      totalXP: 0, level: 1, currentStreak: 0, longestStreak: 0,
      lastActiveDate: null, streakDates: [], lessons: {}, unlockedAchievements: [],
    }))
    setResetOpen(false)
  }

  const editorPreview = (
    <CodeEditor
      value={previewCode}
      onChange={setPreviewCode}
      language="ts"
      fontSize={settings.editorFontSize}
      tabSize={settings.editorTabSize}
      lineNumbers={settings.editorLineNumbers}
      wordWrap={settings.editorWordWrap}
      bracketMatching={settings.editorBracketMatching}
      closeBrackets={settings.editorAutoCloseBrackets}
    />
  )

  const settingsContent = (
    <>
      {/* Editor */}
      <SectionHeader>Editor</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-4 py-4">
        <GridRow label="Font Size">
          <div className="flex items-center gap-3">
            <Slider min={10} max={24} step={1} value={[settings.editorFontSize]} onValueChange={([v]) => updateSetting("editorFontSize", v)} className="w-24" />
            <span className="text-xs text-muted-foreground tabular-nums w-8">{settings.editorFontSize}px</span>
          </div>
        </GridRow>
        <GridRow label="Tab Size">
          <Select value={String(settings.editorTabSize)} onValueChange={(v) => updateSetting("editorTabSize", Number(v))}>
            <SelectTrigger className="w-16 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="8">8</SelectItem>
            </SelectContent>
          </Select>
        </GridRow>
        <GridRow label="Line Numbers">
          <Switch checked={settings.editorLineNumbers} onCheckedChange={(v) => updateSetting("editorLineNumbers", v)} />
        </GridRow>
        <GridRow label="Word Wrap">
          <Switch checked={settings.editorWordWrap} onCheckedChange={(v) => updateSetting("editorWordWrap", v)} />
        </GridRow>
        <GridRow label="Bracket Matching">
          <Switch checked={settings.editorBracketMatching} onCheckedChange={(v) => updateSetting("editorBracketMatching", v)} />
        </GridRow>
        <GridRow label="Auto-Close Brackets">
          <Switch checked={settings.editorAutoCloseBrackets} onCheckedChange={(v) => updateSetting("editorAutoCloseBrackets", v)} />
        </GridRow>
      </div>

      {/* Appearance */}
      <SectionHeader>Appearance</SectionHeader>
      <div className="py-4">
        <GridRow label="Theme">
          <div className="flex gap-1 rounded-md border p-0.5">
            {([["light", Sun, "Light"], ["dark", Moon, "Dark"], ["system", Monitor, "Auto"]] as const).map(([val, Icon, label]) => (
              <Button
                key={val}
                variant={theme === val ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => { setTheme(val); updateSetting("theme", val) }}
              >
                <Icon className="size-3.5 mr-1" />{label}
              </Button>
            ))}
          </div>
        </GridRow>
      </div>

      {/* Notifications */}
      <SectionHeader>Notifications</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-4 py-4">
        <GridRow label="XP Toasts">
          <Switch checked={settings.showXPToasts} onCheckedChange={(v) => updateSetting("showXPToasts", v)} />
        </GridRow>
        <GridRow label="Achievement Toasts">
          <Switch checked={settings.showAchievementToasts} onCheckedChange={(v) => updateSetting("showAchievementToasts", v)} />
        </GridRow>
        <GridRow label="Streak Reminders">
          <Switch checked={settings.showStreakReminders} onCheckedChange={(v) => updateSetting("showStreakReminders", v)} />
        </GridRow>
      </div>

      {/* Learning */}
      <SectionHeader>Learning</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-4 py-4">
        <GridRow label="Auto-Advance">
          <Switch checked={settings.autoAdvance} onCheckedChange={(v) => updateSetting("autoAdvance", v)} />
        </GridRow>
        <GridRow label="Confirm Completion">
          <Switch checked={settings.confirmLessonComplete} onCheckedChange={(v) => updateSetting("confirmLessonComplete", v)} />
        </GridRow>
      </div>

      {/* Data */}
      <SectionHeader>Data</SectionHeader>
      <div className="py-4 space-y-3">
        <GridRow label="Reset Settings">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetSettings}>
            <RotateCcw className="size-3 mr-1.5" />Reset
          </Button>
        </GridRow>
        <GridRow label={completedCount > 0 ? `Reset Progress (${completedCount} lessons)` : "Reset Progress"}>
          <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-7 text-xs">
                <Trash2 className="size-3 mr-1.5" />Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all progress?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently erase all your XP, streaks, achievements, and completed lessons. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleResetProgress}
                >
                  Yes, reset everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </GridRow>
      </div>
    </>
  )

  return (
    <main className="h-[calc(100vh-3.5rem)]">
      {/* ── Mobile / Tablet: v3-style single column scroll ── */}
      <div className="lg:hidden h-full overflow-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">
          <div className="pb-4">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Customize your learning experience.</p>
          </div>

          {/* Hero preview */}
          <div className="rounded-xl border overflow-hidden h-48 sm:h-52 mb-6">
            {editorPreview}
          </div>

          {settingsContent}
        </div>
      </div>

      {/* ── Desktop: v8-style side-by-side ── */}
      <div className="hidden lg:flex h-full">
        {/* Left: pinned preview */}
        <div className="w-1/2 border-r flex flex-col shrink-0">
          <div className="px-6 pt-6 pb-2">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Customize your learning experience.</p>
          </div>
          <div className="flex-1 min-h-0 p-6 pt-2">
            <div className="rounded-lg border overflow-hidden h-full">
              {editorPreview}
            </div>
          </div>
        </div>

        {/* Right: scrollable settings */}
        <div className="flex-1 overflow-auto">
          <div className="px-6 py-6 max-w-xl">
            {settingsContent}
          </div>
        </div>
      </div>
    </main>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b py-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h2>
    </div>
  )
}

function GridRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  )
}
