import type { SandboxTest } from "./sandbox"

export function createRegexTest(id: string, label: string, pattern: string): SandboxTest {
  return { id, label, type: "regex", value: pattern }
}

export function createStringIncludesTest(id: string, label: string, value: string): SandboxTest {
  return { id, label, type: "string-includes", value }
}

export function createStringEqualsTest(id: string, label: string, value: string): SandboxTest {
  return { id, label, type: "string-equals", value }
}

export function createFunctionOutputTest(
  id: string,
  label: string,
  functionName: string,
  args: unknown[],
  expected: unknown
): SandboxTest {
  return { id, label, type: "function-output", value: functionName, args, expected }
}
