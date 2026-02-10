import { CheckCircle2, XCircle, Terminal } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface TestResult {
  id: string
  label: string
  passed: boolean
  error?: string
}

interface TestOutputProps {
  results: TestResult[]
  consoleOutput: string[]
  error?: string
  isRunning?: boolean
}

export function TestOutput({ results, consoleOutput, error, isRunning }: TestOutputProps) {
  const allPassed = results.length > 0 && results.every((r) => r.passed)
  const passedCount = results.filter((r) => r.passed).length

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3 font-mono text-sm">
        {/* Console output */}
        {consoleOutput.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Terminal className="size-3" />
              <span className="text-xs uppercase tracking-wider">Console</span>
            </div>
            {consoleOutput.map((line, i) => (
              <div key={i} className="text-muted-foreground pl-5">
                {line}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-destructive">
            {error}
          </div>
        )}

        {/* Test results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Tests
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  allPassed ? "text-green-500" : "text-muted-foreground"
                )}
              >
                {passedCount}/{results.length} passed
              </span>
            </div>

            {results.map((result) => (
              <div
                key={result.id}
                className={cn(
                  "flex items-start gap-2 rounded-md p-2",
                  result.passed ? "bg-green-500/10" : "bg-destructive/10"
                )}
              >
                {result.passed ? (
                  <CheckCircle2 className="size-4 text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="size-4 text-destructive mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={result.passed ? "text-green-500" : "text-destructive"}>
                    {result.label}
                  </p>
                  {result.error && (
                    <p className="text-xs text-muted-foreground mt-1">{result.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Running state */}
        {isRunning && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Running tests...
          </div>
        )}

        {/* Empty state */}
        {!isRunning && results.length === 0 && !error && (
          <div className="text-muted-foreground text-center py-8">
            Click "Run Tests" to check your code.
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
