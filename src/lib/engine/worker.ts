/// <reference lib="webworker" />

interface TestMessage {
  type: "run"
  code: string
  tests: WorkerTest[]
  setupCode?: string
}

interface WorkerTest {
  id: string
  label: string
  type: "regex" | "string-includes" | "string-equals" | "function-output"
  value: string
  args?: unknown[]
  expected?: unknown
}

interface TestResult {
  id: string
  label: string
  passed: boolean
  error?: string
}

interface WorkerResponse {
  type: "results"
  results: TestResult[]
  consoleOutput: string[]
  error?: string
}

const consoleOutput: string[] = []

// Override console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
}

console.log = (...args: unknown[]) => {
  consoleOutput.push(args.map(String).join(" "))
}
console.warn = (...args: unknown[]) => {
  consoleOutput.push(`[warn] ${args.map(String).join(" ")}`)
}
console.error = (...args: unknown[]) => {
  consoleOutput.push(`[error] ${args.map(String).join(" ")}`)
}

self.onmessage = (event: MessageEvent<TestMessage>) => {
  const { code, tests, setupCode } = event.data
  consoleOutput.length = 0

  try {
    // Only execute user code if there are tests that need it (function-output).
    // For string-based tests (regex, string-includes, string-equals),
    // execution is unnecessary and would fail on non-JS content like JSON.
    const needsExecution = tests.some((t) => t.type === "function-output")

    if (needsExecution) {
      // Run setup code if provided
      if (setupCode) {
        new Function(setupCode)()
      }

      // Execute user code
      const userFn = new Function(code)
      userFn()
    }

    // Run tests
    const results: TestResult[] = tests.map((test) => {
      try {
        return runTest(test, code)
      } catch (e: any) {
        return { id: test.id, label: test.label, passed: false, error: e.message }
      }
    })

    const response: WorkerResponse = { type: "results", results, consoleOutput: [...consoleOutput] }
    self.postMessage(response)
  } catch (e: any) {
    const response: WorkerResponse = {
      type: "results",
      results: tests.map((t) => ({ id: t.id, label: t.label, passed: false, error: e.message })),
      consoleOutput: [...consoleOutput],
      error: e.message,
    }
    self.postMessage(response)
  }
}

function runTest(test: WorkerTest, code: string): TestResult {
  switch (test.type) {
    case "regex": {
      const regex = new RegExp(test.value)
      const passed = regex.test(code)
      return {
        id: test.id,
        label: test.label,
        passed,
        error: passed ? undefined : `Code does not match pattern: ${test.value}`,
      }
    }
    case "string-includes": {
      const passed = code.includes(test.value)
      return {
        id: test.id,
        label: test.label,
        passed,
        error: passed ? undefined : `Code should include: "${test.value}"`,
      }
    }
    case "string-equals": {
      const passed = code.trim() === test.value.trim()
      return {
        id: test.id,
        label: test.label,
        passed,
        error: passed ? undefined : "Code does not match expected output",
      }
    }
    case "function-output": {
      // test.value is the function name to call
      // test.args are the arguments
      // test.expected is the expected return value
      const fn = new Function(`${code}\nreturn ${test.value}`)()
      let result: unknown
      if (typeof fn === "function") {
        result = fn(...(test.args ?? []))
      } else {
        result = fn
      }

      const passed = JSON.stringify(result) === JSON.stringify(test.expected)
      return {
        id: test.id,
        label: test.label,
        passed,
        error: passed
          ? undefined
          : `Expected ${JSON.stringify(test.expected)}, got ${JSON.stringify(result)}`,
      }
    }
    default:
      return { id: test.id, label: test.label, passed: false, error: `Unknown test type: ${test.type}` }
  }
}
