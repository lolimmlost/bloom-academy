import { useCallback, useMemo } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { sql } from "@codemirror/lang-sql"
import { css } from "@codemirror/lang-css"
import { json } from "@codemirror/lang-json"
import { autocompletion, type CompletionContext } from "@codemirror/autocomplete"
import type { ChallengeCompletion } from "@/lib/content/types"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: "ts" | "tsx" | "sql" | "css" | "json"
  readOnly?: boolean
  fontSize?: number
  tabSize?: number
  className?: string
  completions?: ChallengeCompletion[]
}

const languageExtensions = {
  ts: () => javascript({ typescript: true }),
  tsx: () => javascript({ typescript: true, jsx: true }),
  sql: () => sql(),
  css: () => css(),
  json: () => json(),
}

export function CodeEditor({
  value,
  onChange,
  language = "ts",
  readOnly = false,
  fontSize = 14,
  tabSize = 2,
  className,
  completions: customCompletions,
}: CodeEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      onChange(val)
    },
    [onChange]
  )

  const langExt = languageExtensions[language]?.() ?? javascript({ typescript: true })

  const extensions = useMemo(() => {
    const exts = [langExt]
    if (customCompletions && customCompletions.length > 0) {
      const completionSource = (context: CompletionContext) => {
        const word = context.matchBefore(/\w*/)
        if (!word || (word.from === word.to && !context.explicit)) return null
        return {
          from: word.from,
          options: customCompletions.map((c) => ({
            label: c.label,
            type: c.type ?? "keyword",
            detail: c.detail,
            apply: c.template ?? c.label,
          })),
        }
      }
      exts.push(autocompletion({ override: [completionSource] }))
    }
    return exts
  }, [langExt, customCompletions])

  return (
    <CodeMirror
      value={value}
      onChange={handleChange}
      extensions={extensions}
      readOnly={readOnly}
      theme="dark"
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        highlightActiveLine: true,
        foldGutter: true,
        indentOnInput: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        tabSize,
      }}
      height="100%"
      style={{ fontSize: `${fontSize}px`, height: "100%" }}
      className={className}
    />
  )
}
