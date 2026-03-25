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

Before we dive into the specifics, let's zoom out and understand *why* a tool like TanStack Start exists in the first place.

## What is a Meta-Framework?

React, on its own, is a **UI library** — it's great at rendering components and managing state, but it doesn't have opinions about routing, data fetching, server rendering, or project structure. If you start a project with just React, you'll quickly find yourself asking: "How do I set up routing? How do I fetch data? How do I render pages on the server?"

A **meta-framework** is a framework built *on top of* a UI library that answers all of those questions for you. It provides the architecture and conventions that turn a UI library into a complete application platform.

You might have heard of some popular meta-frameworks:

- **Next.js** — The most widely used React meta-framework, created by Vercel
- **Remix** — Focused on web standards and progressive enhancement (now merging with React Router)
- **TanStack Start** — The newest contender, built on the incredibly type-safe TanStack Router

What do meta-frameworks give you on top of React?

- **Routing** — A system for mapping URLs to pages
- **Server-side rendering** — Generating HTML on the server for faster loads and better SEO
- **Data fetching** — Patterns for loading data before rendering pages
- **API/server functions** — A way to run server-side code without building a separate backend
- **Build tooling** — Optimized bundling, code splitting, and deployment

We're using **TanStack Start** because its TypeScript integration is second to none. Route parameters, search parameters, and data loading are *all* fully type-safe — if you make a typo in a route path or pass the wrong type to a link, TypeScript catches it at compile time. That's a huge win for developer productivity and code reliability.

## File-Based Routing

In TanStack Start, your route files live in `src/routes/`. The file path maps directly to the URL:

```
src/routes/index.tsx        → /
src/routes/about.tsx        → /about
src/routes/products/index.tsx → /products
src/routes/products/$id.tsx → /products/:id
```

### Why File-Based Routing?

In the early days of React, you'd configure routes manually in code:

```tsx
// The old way — manual route configuration
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="/products" element={<Products />} />
  <Route path="/products/:id" element={<ProductDetail />} />
</Routes>
```

This works, but it has downsides: you have to maintain a centralized route configuration, remember to import every page component, and manually keep your URLs and code in sync.

**File-based routing** flips the script — the framework generates routes automatically from your file structure. This is a great example of **convention over configuration**: instead of writing code to wire things up, you follow a naming convention and the framework handles the rest.

The benefits are significant:

- **Less boilerplate** — No route configuration files to maintain
- **Automatic code splitting** — Each route becomes its own chunk, so the browser only downloads the code for the page being visited
- **Discoverable structure** — New developers on the team can look at the file tree and immediately understand the app's URL structure
- **Colocation** — Route-specific logic lives right next to the route file, keeping related code together

### The `$param` Syntax for Dynamic Routes

Notice the `$id` in `src/routes/products/$id.tsx`. The **dollar sign prefix** marks a route segment as **dynamic** — it will match any value in that position of the URL.

For example, `src/routes/products/$id.tsx` matches:
- `/products/1`
- `/products/abc`
- `/products/sunrise-bouquet`

Inside that route component, you can access the dynamic value using `Route.useParams()`:

```tsx
const { id } = Route.useParams()
// If the URL is /products/sunrise-bouquet, id === "sunrise-bouquet"
```

Because TanStack Start is fully type-safe, TypeScript *knows* that `id` is a string and that it exists — no need for manual type assertions or null checks.

## How SSR Works

**SSR** stands for **Server-Side Rendering**, and it's one of the most important features a meta-framework provides. To understand why, let's look at the three main rendering strategies:

### Client-Side Rendering (CSR)

This is what you get with a plain React app (like one created with Vite's React template):

1. The browser downloads a mostly-empty HTML file
2. It downloads your JavaScript bundle
3. React runs in the browser and generates the page content
4. The user finally sees the page

The problem? Until step 4 completes, the user sees a blank screen (or a loading spinner). Search engines might not index your content because the HTML is empty when they crawl it.

### Server-Side Rendering (SSR)

With SSR, the process is different:

1. The server runs your React components and generates **complete HTML**
2. The browser receives and displays that HTML immediately — the user can see the page
3. JavaScript loads in the background
4. React **hydrates** the page — attaching event handlers to the existing HTML to make it interactive

The big wins: users see content faster (no blank screen), and search engines can crawl the fully-rendered HTML for better **SEO** (Search Engine Optimization).

### Static Site Generation (SSG)

SSG generates all the HTML at **build time** rather than on each request. This is great for content that rarely changes (like blog posts or documentation), but it's not a good fit for dynamic e-commerce data that changes frequently.

### Why SSR for Our E-Commerce App?

We're using SSR because:

- **Product pages need to be indexed by search engines** — customers search Google for flowers
- **Fast initial loads** — shoppers expect pages to appear instantly; a blank screen means lost sales
- **Dynamic data** — product availability, prices, and inventory change constantly, so static generation won't cut it

TanStack Start handles SSR automatically — you just write normal React components, and the framework takes care of rendering them on the server first.

## Server Functions

One of the most powerful features of modern meta-frameworks is the ability to run server-side code without building a separate API.

Traditionally, if your React frontend needed data from a database, you'd:

1. Build a separate API server (e.g., with Express)
2. Define REST endpoints (e.g., `GET /api/products`)
3. Write `fetch()` calls in your frontend to hit those endpoints
4. Handle serialization, error responses, and type mismatches manually

**Server functions** eliminate most of this ceremony. They let you write a function that runs on the server and call it directly from your client code — the framework handles the network request behind the scenes.

Here's a conceptual example:

```typescript
// This function runs on the SERVER — it can access the database directly
const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  const products = await db.select().from(productsTable)
  return products
})

// In your component, call it like any other function
function ProductsPage() {
  const products = Route.useLoaderData()
  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  )
}
```

This is sometimes called **RPC-style** (Remote Procedure Call) because from the developer's perspective, you're just calling a function — the fact that it crosses a network boundary is abstracted away. The benefits are huge:

- **No boilerplate API routes** — No need for a separate Express/Fastify server
- **Full type safety** — The return type of the server function flows through to the component, with zero manual typing
- **Automatic serialization** — Data is serialized and deserialized for you
- **Colocation** — Your data-fetching logic lives right next to the UI that uses it

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

The `createFileRoute` function takes the route path as an argument and returns a configuration object where you can define:

- **`component`** — The React component to render
- **`loader`** — A function that loads data before the component renders
- **`beforeLoad`** — A function that runs before the loader (useful for auth checks)
- **`errorComponent`** — What to show if something goes wrong

## Your Task

Create a route component for the home page (`/`) that renders a welcome heading for Indigo Sun Florals.

Your component should:
- Use `createFileRoute` with the path `"/"`
- Return an `h1` element with the text "Welcome to Indigo Sun Florals"
