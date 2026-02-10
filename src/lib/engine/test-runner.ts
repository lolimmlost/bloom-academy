import { CodeSandbox, type SandboxResult, type SandboxTest } from "./sandbox"
import type { ChallengeTest } from "../content/types"

let sandbox: CodeSandbox | null = null

function getSandbox(): CodeSandbox {
  if (!sandbox) {
    sandbox = new CodeSandbox()
  }
  return sandbox
}

export function mapChallengeTests(tests: ChallengeTest[]): SandboxTest[] {
  return tests.map((t) => ({
    id: t.id,
    label: t.label,
    type: t.type,
    value: t.value,
    args: t.args,
    expected: t.expected,
  }))
}

export async function runTests(
  code: string,
  tests: ChallengeTest[],
  setupCode?: string
): Promise<SandboxResult> {
  const sb = getSandbox()
  const mappedTests = mapChallengeTests(tests)
  return sb.run(code, mappedTests, setupCode)
}

export function terminateSandbox(): void {
  if (sandbox) {
    sandbox.terminate()
    sandbox = null
  }
}
