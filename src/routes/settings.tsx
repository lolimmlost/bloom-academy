import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const Route = createFileRoute("/settings")({ component: SettingsPage })

function SettingsPage() {
  return (
    <main className="p-6 space-y-6 max-w-2xl mx-auto pb-20 md:pb-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Editor Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Font Size</p>
              <p className="text-sm text-muted-foreground">Adjust the code editor font size</p>
            </div>
            <span className="text-sm">14px</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tab Size</p>
              <p className="text-sm text-muted-foreground">Number of spaces per tab</p>
            </div>
            <span className="text-sm">2</span>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
