import { useState, useCallback, useRef, useEffect } from "react"
import type { Challenge } from "@/lib/content/types"
import type { SandboxResult } from "@/lib/engine/sandbox"
import { runTests, terminateSandbox } from "@/lib/engine/test-runner"

export function useChallenge(challenge: Challenge) {
  const [code, setCode] = useState(challenge.starterCode)
  const [results, setResults] = useState<SandboxResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [solutionViewed, setSolutionViewed] = useState(false)
  const startTime = useRef(Date.now())

  // Clean up on unmount
  useEffect(() => {
    return () => terminateSandbox()
  }, [])

  const run = useCallback(async () => {
    setIsRunning(true)
    setAttempts((prev) => prev + 1)
    try {
      const result = await runTests(code, challenge.tests, challenge.setupCode)
      setResults(result)
      return result
    } catch {
      const errorResult: SandboxResult = {
        results: [],
        consoleOutput: [],
        error: "Failed to run tests",
      }
      setResults(errorResult)
      return errorResult
    } finally {
      setIsRunning(false)
    }
  }, [code, challenge])

  const reset = useCallback(() => {
    setCode(challenge.starterCode)
    setResults(null)
  }, [challenge.starterCode])

  const getTimeSpent = useCallback(() => {
    return Math.round((Date.now() - startTime.current) / 1000)
  }, [])

  return {
    code,
    setCode,
    results,
    isRunning,
    attempts,
    hintsUsed,
    setHintsUsed,
    solutionViewed,
    setSolutionViewed,
    run,
    reset,
    getTimeSpent,
  }
}
