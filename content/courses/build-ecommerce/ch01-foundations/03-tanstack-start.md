---
id: "03-tanstack-start"
title: "Understanding TanStack Start"
type: "code"
xp: 25
difficulty: 3
order: 3
prerequisites: ["02-project-setup"]
hints:
  - "TanStack Start uses createFileRoute to define routes from file paths."
  - "The component function returns JSX that renders on that route."
---

# Understanding TanStack Start

TanStack Start is a full-stack React framework built on TanStack Router. It provides:

- **File-based routing** — your file structure becomes your URL structure
- **Server functions** — call server-side code from the client
- **Type-safe routing** — full TypeScript support for route params and search params
- **SSR** — server-side rendering out of the box

## File-Based Routing

In TanStack Start, your route files live in `src/routes/`. The file path maps directly to the URL:

```
src/routes/index.tsx        → /
src/routes/about.tsx        → /about
src/routes/products/index.tsx → /products
src/routes/products/$id.tsx → /products/:id
```

## Creating a Route

Each route file exports a `Route` object created with `createFileRoute`:

```typescript
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/about")({
  component: AboutPage,
})

function AboutPage() {
  return <h1>About Us</h1>
}
```

## Your Task

Create a route component for the home page (`/`) that renders a welcome heading for Indigo Sun Florals.

Your component should:
- Use `createFileRoute` with the path `"/"`
- Return an `h1` element with the text "Welcome to Indigo Sun Florals"
