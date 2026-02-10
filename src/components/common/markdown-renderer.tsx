import { useState, useEffect } from "react"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const [mounted, setMounted] = useState(false)
  const [MarkdownModule, setMarkdownModule] = useState<any>(null)
  const [remarkGfm, setRemarkGfm] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    Promise.all([
      import("react-markdown"),
      import("remark-gfm"),
    ]).then(([md, gfm]) => {
      setMarkdownModule(() => md.default)
      setRemarkGfm(() => gfm.default)
    })
  }, [])

  if (!mounted || !MarkdownModule) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </div>
    )
  }

  const ReactMarkdown = MarkdownModule

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }: any) => (
            <h1 className="text-3xl font-bold mt-8 mb-4 first:mt-0">{children}</h1>
          ),
          h2: ({ children }: any) => (
            <h2 className="text-2xl font-semibold mt-6 mb-3">{children}</h2>
          ),
          h3: ({ children }: any) => (
            <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>
          ),
          p: ({ children }: any) => (
            <p className="mb-4 leading-7">{children}</p>
          ),
          ul: ({ children }: any) => (
            <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
          ),
          ol: ({ children }: any) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
          ),
          li: ({ children }: any) => (
            <li className="leading-7">{children}</li>
          ),
          code: ({ className: cn, children, ...props }: any) => {
            const isInline = !cn
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code className={`${cn} block`} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }: any) => (
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto mb-4 text-sm">
              {children}
            </pre>
          ),
          blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-4">
              {children}
            </blockquote>
          ),
          a: ({ href, children }: any) => (
            <a href={href} className="text-primary underline underline-offset-4 hover:text-primary/80" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }: any) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-border">{children}</table>
            </div>
          ),
          th: ({ children }: any) => (
            <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">{children}</th>
          ),
          td: ({ children }: any) => (
            <td className="border border-border px-4 py-2">{children}</td>
          ),
          hr: () => <hr className="my-6 border-border" />,
          img: ({ src, alt }: any) => (
            <img src={src} alt={alt || ""} className="rounded-lg max-w-full my-4" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
