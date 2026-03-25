---
id: "03-dynamic-routes"
title: "Dynamic Routes & Product Details"
type: "code"
xp: 30
difficulty: 3
order: 3
prerequisites: ["02-product-listing"]
hints:
  - "Use createFileRoute with '/products/$id' to define a dynamic route."
  - "In the loader, access the product ID via params.id."
  - "Use eq(products.id, id) from drizzle-orm to filter by a specific product."
  - "Access the loaded product data with Route.useLoaderData() in the component."
---

# Dynamic Routes & Product Details

Your product listing page shows customers what is available. But when someone clicks on a product, they expect to see a **detail page** — a dedicated page with more information about that specific item. To build this, you need **dynamic routes**: routes where part of the URL changes based on which product the user selected.

## What Are Dynamic Routes?

So far, our routes have been **static** — each file maps to a single, fixed URL:

```
src/routes/index.tsx      → /
src/routes/products.tsx   → /products
```

But what about URLs like `/products/sunrise-bouquet` or `/products/lavender-dreams`? You cannot create a separate file for every product — you would need hundreds of files, and you would have to add a new one every time you add a product to your inventory.

**Dynamic routes** solve this. They use a special naming convention to match a *pattern* of URLs with a single file:

```
src/routes/products/$id.tsx → /products/anything-here
```

The `$id` part is a **route parameter**. The dollar sign tells TanStack Start: "This segment of the URL is dynamic — capture whatever value appears here and make it available as `id`."

This single file handles every product URL:
- `/products/sunrise-bouquet` — `id` is `"sunrise-bouquet"`
- `/products/lavender-dreams` — `id` is `"lavender-dreams"`
- `/products/42` — `id` is `"42"`

## Accessing Route Parameters

Inside your route, you access dynamic parameters through the `params` object. TanStack Start provides this in two places:

**In the loader** (for data fetching):

```typescript
export const Route = createFileRoute("/products/$id")({
  loader: ({ params }) => fetchProduct(params.id),
  component: ProductDetail,
})
```

**In the component** (for rendering):

```typescript
function ProductDetail() {
  const { id } = Route.useParams()
  // ...
}
```

Because TanStack Start is fully type-safe, TypeScript knows that `params.id` exists and is a string. If you tried to access `params.slug` on a route that only defines `$id`, TypeScript would flag it as an error. This kind of compile-time safety prevents an entire category of bugs.

## Loading a Single Product

With the route parameter in hand, you can write a server function that fetches a specific product from the database:

```typescript
import { createServerFn } from "@tanstack/react-start"
import { db } from "@/database/db"
import { products } from "@/database/schema"
import { eq } from "drizzle-orm"

const fetchProduct = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
    return result[0] ?? null
  })
```

Let's break this down:

- **`eq(products.id, id)`** — The `eq` function from Drizzle generates a SQL `WHERE` clause: `WHERE products.id = $1`. It is type-safe — if `products.id` is a `string` column, Drizzle ensures you pass a string.
- **`result[0] ?? null`** — `db.select()` always returns an array. Since we are querying by a unique ID, we expect either one result or none. The `??` (nullish coalescing) operator returns `null` if the array is empty.

The generated SQL looks like:

```sql
SELECT * FROM products WHERE id = 'sunrise-bouquet'
```

## Handling Missing Products

What happens if someone visits `/products/does-not-exist`? The database query returns an empty array, and `result[0]` is `undefined`. You need to handle this gracefully.

TanStack Start provides a `notFound()` function for exactly this scenario:

```typescript
import { notFound } from "@tanstack/react-router"

const fetchProduct = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))

    if (!result[0]) {
      throw notFound()
    }

    return result[0]
  })
```

When `notFound()` is thrown, TanStack Start renders your route's `notFoundComponent` (or a default 404 page if you have not defined one):

```typescript
export const Route = createFileRoute("/products/$id")({
  loader: ({ params }) => fetchProduct({ data: params.id }),
  component: ProductDetail,
  notFoundComponent: () => (
    <div>
      <h1>Product Not Found</h1>
      <p>We could not find the product you are looking for.</p>
    </div>
  ),
})
```

This is a much better experience than showing a broken page with undefined values or a generic error screen. Your customers see a clear message, and you can even suggest alternative products or link back to the catalog.

## Building the Product Detail Component

With the data loading handled, the component itself is straightforward:

```tsx
function ProductDetail() {
  const product = Route.useLoaderData()

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold">{product.name}</h1>
      <p className="text-xl text-gray-600 mt-2">
        ${(product.price / 100).toFixed(2)}
      </p>
      <p className="mt-4 text-gray-700">{product.description}</p>
    </div>
  )
}
```

`Route.useLoaderData()` returns the data from the loader — in this case, the product object. Because the loader already handles the "not found" case by throwing, you can be confident that `product` is always a valid product object inside this component.

## Linking to Product Detail Pages

From the product listing grid, you want each card to link to its detail page. TanStack Start provides a type-safe `Link` component:

```tsx
import { Link } from "@tanstack/react-router"

function ProductCard({ product }) {
  return (
    <Link
      to="/products/$id"
      params={{ id: product.id }}
      className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
    >
      <h3 className="font-semibold">{product.name}</h3>
      <p>${(product.price / 100).toFixed(2)}</p>
    </Link>
  )
}
```

The `to` and `params` props are fully type-safe. If you type `to="/products/$id"`, TypeScript knows that `params` must include an `id` property. If you forget it, you get a compile-time error. If you type a route that does not exist, TypeScript catches that too. This is one of the most satisfying features of TanStack Router — your links are validated at build time, not when a customer clicks a broken link in production.

## Your Task

Create a product detail route that loads a single product by its ID from the URL parameter.

Your code should:
1. Import `createFileRoute` from `@tanstack/react-router`
2. Import `createServerFn` from `@tanstack/react-start`
3. Create a server function that fetches a single product by ID using `eq()` from Drizzle
4. Create a route at `/products/$id` with a loader that passes `params.id` to the server function
5. Define a `ProductDetail` component that uses `Route.useLoaderData()` to display the product name
