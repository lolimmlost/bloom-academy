---
id: "01-server-functions"
title: "Server Functions"
type: "info"
xp: 20
difficulty: 3
order: 1
prerequisites: []
hints: []
---

# Server Functions

In the previous chapters, we set up our database and authentication. Now it is time to connect the dots — pulling data from the database and displaying it to users. To do that, we need to understand one of the most powerful features in TanStack Start: **server functions**.

## The Problem Server Functions Solve

Imagine you want to show a list of products on your flower shop's homepage. The product data lives in your PostgreSQL database. But your React components run in the browser — and browsers cannot talk to databases directly. There are very good reasons for this: databases contain sensitive data, connection credentials must be kept secret, and you do not want to expose your entire database to anyone with a browser's developer tools open.

Traditionally, you would solve this by building a **separate API server**. The workflow looked like this:

1. Set up an Express or Fastify server
2. Define a route like `GET /api/products`
3. Write a handler that queries the database and returns JSON
4. In your React frontend, write a `fetch()` call to `GET /api/products`
5. Handle loading states, errors, and type mismatches on both sides

That is a lot of ceremony for "get data from database, show it on screen." You end up maintaining two separate codebases (or at least two separate layers), manually keeping their types in sync, and writing boilerplate for every new endpoint.

**Server functions** eliminate most of this. They let you write a function that runs on the server and call it as if it were a regular function in your client code. The framework handles the network boundary transparently.

## What Is `createServerFn`?

TanStack Start provides a function called `createServerFn` that marks a function as server-only. Here is what it looks like:

```typescript
import { createServerFn } from "@tanstack/react-start"
import { db } from "@/database/db"
import { products } from "@/database/schema"

const fetchProducts = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(products)
})
```

Let's break down what is happening:

- **`createServerFn`** tells TanStack Start: "This function should only ever execute on the server."
- **`{ method: "GET" }`** specifies the HTTP method. Use `GET` for reading data and `POST` for mutations (creating, updating, deleting).
- **`.handler(async () => { ... })`** contains your actual server logic. Inside this function, you have full access to server-side resources: databases, file systems, environment variables, third-party APIs with secret keys — anything you would normally do on a backend.

When your client code calls `fetchProducts()`, here is what actually happens under the hood:

1. TanStack Start serializes the function call into an HTTP request
2. The request is sent to the server
3. The server executes the handler function
4. The return value is serialized and sent back as the response
5. The client receives the data, fully typed

You never see any of this. From your perspective as a developer, you just called a function and got data back. This is the **RPC pattern** (Remote Procedure Call) — the network boundary is abstracted away.

## RPC: Remote Procedure Call

The term **RPC** has been around since the 1980s, but it has seen a massive resurgence in modern web development. The core idea is simple: make calling a function on a remote server feel exactly like calling a local function.

Compare these two approaches:

```typescript
// Traditional REST approach
const response = await fetch("/api/products")
if (!response.ok) throw new Error("Failed to fetch")
const products: Product[] = await response.json()

// Server function approach (RPC)
const products = await fetchProducts()
```

The RPC version is shorter, but the real advantage is **type safety**. With the REST approach, `response.json()` returns `any` — you have to manually assert the type, and if the API shape changes, TypeScript cannot warn you. With a server function, the return type flows directly from the handler to the caller. If you change the database query, every component that uses that data gets updated types automatically.

## Type-Safe Inputs and Outputs

Server functions can accept typed parameters. TanStack Start validates and serializes these automatically:

```typescript
const fetchProductById = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
    return result[0] ?? null
  })
```

The `.validator()` method defines the expected input shape. This serves two purposes:

1. **Runtime validation** — if someone passes invalid data, the function rejects it before your handler runs
2. **Type inference** — TypeScript knows the handler receives a `string` and can infer the return type from the query

When you call this from a component, everything is typed end-to-end:

```typescript
const product = await fetchProductById({ data: "some-id" })
// TypeScript knows `product` is the shape returned by the query, or null
```

## Common Use Cases

Server functions are the right tool whenever you need to:

- **Query the database** — fetch products, users, orders, or any other data
- **Check authentication** — verify the user's session before returning sensitive data
- **Access secrets** — use API keys for Stripe, email services, or other third-party tools
- **Perform file operations** — read configuration files, write logs, or process uploads
- **Run expensive computations** — keep heavy work off the client and on the server

## Using Server Functions in Route Loaders

The most common pattern is combining server functions with **route loaders**. A loader runs before your component renders, ensuring data is ready when the page appears:

```typescript
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/products")({
  loader: () => fetchProducts(),
  component: ProductsPage,
})

function ProductsPage() {
  const products = Route.useLoaderData()
  // `products` is available immediately — no loading spinner needed
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  )
}
```

When a user navigates to `/products`, TanStack Start:

1. Calls the `loader` function
2. The loader calls `fetchProducts()`, which executes on the server
3. The server queries the database and returns the products
4. The component renders with the data already available via `useLoaderData()`

There is no loading state to manage, no `useEffect` to write, and no race conditions to worry about. The data is simply *there* when the component mounts.

## Server Functions vs API Routes

You might wonder: "Should I ever still write traditional API routes?" Yes — there are a few cases where API routes are more appropriate:

- **Third-party webhooks** — services like Stripe send HTTP requests to a URL you define. Webhooks need a stable endpoint, not an RPC call.
- **Public APIs** — if other developers need to consume your API, a RESTful design with documented endpoints is more appropriate.
- **File uploads** — handling multipart form data sometimes requires more control than server functions provide.

For everything else — fetching data for your own UI, performing mutations triggered by user actions, running server-side validation — server functions are the way to go.

## What's Next

Now that you understand server functions, we are going to put them to work. In the next lesson, you will write a server function that queries all products from the database and build a component that displays them in a responsive grid. This is the foundation of our product catalog — the heart of any e-commerce store.
