import { useState, useCallback, useRef, useEffect } from "react"
import { Play, Send, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeEditor } from "./code-editor"
import { TestOutput } from "./test-output"
import { HintButton } from "./hint-button"
import { SolutionViewer } from "./solution-viewer"
import type { Challenge } from "@/lib/content/types"
import type { SandboxResult } from "@/lib/engine/sandbox"
import { runTests } from "@/lib/engine/test-runner"
import { useSettings } from "@/lib/settings/context"

interface CodeChallengeProps {
  challenge: Challenge
  hints: string[]
  onComplete: (params: {
    code: string
    attempts: number
    hintsUsed: number
    solutionViewed: boolean
    timeSpentSecs: number
  }) => void
}

export function CodeChallenge({ challenge, hints, onComplete }: CodeChallengeProps) {
  const { settings } = useSettings()
  const [code, setCode] = useState(challenge.starterCode)
  const [results, setResults] = useState<SandboxResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [solutionViewed, setSolutionViewed] = useState(false)
  const [completed, setCompleted] = useState(false)
  const startTime = useRef(Date.now())

  const handleRunTests = useCallback(async () => {
    setIsRunning(true)
    setAttempts((prev) => prev + 1)

    try {
      const result = await runTests(code, challenge.tests, challenge.setupCode)
      setResults(result)

      const allPassed = result.results.every((r) => r.passed)
      if (allPassed && !completed) {
        setCompleted(true)
        const timeSpentSecs = Math.round((Date.now() - startTime.current) / 1000)
        onComplete({
          code,
          attempts: attempts + 1,
          hintsUsed,
          solutionViewed,
          timeSpentSecs,
        })
      }
    } catch {
      setResults({
        results: [],
        consoleOutput: [],
        error: "Failed to run tests",
      })
    } finally {
      setIsRunning(false)
    }
  }, [code, challenge, attempts, hintsUsed, solutionViewed, completed, onComplete])

  const handleReset = useCallback(() => {
    setCode(challenge.starterCode)
    setResults(null)
  }, [challenge.starterCode])

  const handleHintUsed = useCallback(() => {
    setHintsUsed((prev) => prev + 1)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        handleRunTests()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleRunTests])

  return (
    <div className="flex flex-col h-full">
      {/* Editor */}
      <div className="flex-1 min-h-0">
        <CodeEditor
          value={code}
          onChange={setCode}
          language={challenge.language}
          completions={challenge.completions}
          fontSize={settings.editorFontSize}
          tabSize={settings.editorTabSize}
          lineNumbers={settings.editorLineNumbers}
          wordWrap={settings.editorWordWrap}
          bracketMatching={settings.editorBracketMatching}
          closeBrackets={settings.editorAutoCloseBrackets}
          className="h-full"
        />
      </div>

      {/* Controls */}
      <div className="relative flex items-center gap-2 px-4 py-2 border-t border-b">
        <Button
          onClick={handleRunTests}
          disabled={isRunning}
          size="sm"
        >
          {completed ? (
            <>
              <Send className="size-4 mr-1" />
              Submit
            </>
          ) : (
            <>
              <Play className="size-4 mr-1" />
              Run Tests
            </>
          )}
        </Button>
        <Button onClick={handleReset} variant="outline" size="sm">
          <RotateCcw className="size-4 mr-1" />
          Reset
        </Button>

        <div className="flex-1" />

        {hints.length > 0 && (
          <HintButton hints={hints} onHintUsed={handleHintUsed} />
        )}
        <SolutionViewer
          solution={challenge.solution}
          onViewed={() => setSolutionViewed(true)}
        />
      </div>

      {/* Test Output */}
      <div className="h-48 min-h-0">
        <TestOutput
          results={results?.results ?? []}
          consoleOutput={results?.consoleOutput ?? []}
          error={results?.error}
          isRunning={isRunning}
        />
      </div>
    </div>
  )
}
