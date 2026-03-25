import SandboxWorker from "./worker?worker"

export interface TestResult {
  id: string
  label: string
  passed: boolean
  error?: string
}

export interface SandboxResult {
  results: TestResult[]
  consoleOutput: string[]
  error?: string
}

export interface SandboxTest {
  id: string
  label: string
  type: "regex" | "string-includes" | "string-equals" | "function-output"
  value: string
  args?: unknown[]
  expected?: unknown
}

const TIMEOUT_MS = 5000

export class CodeSandbox {
  private worker: Worker | null = null

  private createWorker(): Worker {
    return new SandboxWorker()
  }

  async run(code: string, tests: SandboxTest[], setupCode?: string): Promise<SandboxResult> {
    // Terminate any existing worker
    this.terminate()

    return new Promise((resolve) => {
      const worker = this.createWorker()
      this.worker = worker

      const timeout = setTimeout(() => {
        this.terminate()
        resolve({
          results: tests.map((t) => ({
            id: t.id,
            label: t.label,
            passed: false,
            error: "Execution timed out — check for infinite loops",
          })),
          consoleOutput: [],
          error: "Execution timed out after 5 seconds",
        })
      }, TIMEOUT_MS)

      worker.onmessage = (event) => {
        clearTimeout(timeout)
        resolve(event.data)
      }

      worker.onerror = (error) => {
        clearTimeout(timeout)
        resolve({
          results: tests.map((t) => ({
            id: t.id,
            label: t.label,
            passed: false,
            error: error.message || "Worker error",
          })),
          consoleOutput: [],
          error: error.message || "Worker error",
        })
      }

      worker.postMessage({ type: "run", code, tests, setupCode })
    })
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}
