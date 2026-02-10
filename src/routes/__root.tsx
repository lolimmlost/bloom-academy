import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { Providers } from "@/components/providers"
import { AppShell } from "@/components/layout/app-shell"
import { NotFoundPage } from "@/components/error/not-found"
import { ErrorFallback } from "@/components/error/error-boundary"
import { Toaster } from "@/components/ui/sonner"
import appCss from "../styles/styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: "Bloom Academy" },
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "description",
        content: "Learn to build an e-commerce site through interactive coding lessons",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ({ error }) => <ErrorFallback error={error} />,

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>

      <body className="min-h-screen flex flex-col">
        <Providers>
          {children}

          <Toaster />
        </Providers>

        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />

        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
