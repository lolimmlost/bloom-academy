---
id: "04-search-filter"
title: "Search & Filtering"
type: "code"
xp: 30
difficulty: 4
order: 4
prerequisites: ["03-dynamic-routes"]
hints:
  - "Use ilike() from drizzle-orm for case-insensitive text search."
  - "Build an array of conditions and combine them with and()."
  - "Only add a condition when the corresponding search parameter is provided."
  - "Use the spread operator with and(...conditions) to pass all conditions."
---

# Search & Filtering

A product catalog without search is like a library without a card catalog — customers know what they want, but they have no way to find it. In this lesson, you will build search and filtering functionality that lets users narrow down the product list by text query and category.

## Search Params in TanStack Router

Most web applications store search and filter state in the **URL query string**:

```
/products?query=roses&category=bouquets
```

This is better than storing filter state in React's `useState` for several important reasons:

- **Shareable** — A customer can copy the URL and send it to a friend. The friend sees the exact same filtered view.
- **Bookmarkable** — Users can bookmark a specific search to return to later.
- **Back button works** — Pressing the browser's back button returns to the previous filter state, not the unfiltered page.
- **SEO-friendly** — Search engines can index filtered views as distinct pages.

TanStack Router has first-class support for **type-safe search params**. You define the shape of your search params using `validateSearch`, and the router ensures that every link, navigation, and access to those params is fully typed:

```typescript
import { createFileRoute } from "@tanstack/react-router"

type ProductSearch = {
  query?: string
  category?: string
}

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    query: typeof search.query === "string" ? search.query : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  loader: ({ context, search }) => searchProducts(search),
  component: ProductsPage,
})
```

The `validateSearch` function receives the raw query string (parsed into an object) and returns a typed, validated object. This serves as both a **runtime validator** (protecting against malformed URLs) and a **type definition** (giving TypeScript full knowledge of your search params).

## Accessing Search Params in Components

Inside your component, you read search params with `Route.useSearch()`:

```tsx
function ProductsPage() {
  const { query, category } = Route.useSearch()
  const products = Route.useLoaderData()
  // ...
}
```

To update search params, use the `useNavigate` hook:

```tsx
import { useNavigate } from "@tanstack/react-router"

function SearchInput() {
  const { query } = Route.useSearch()
  const navigate = useNavigate()

  return (
    <input
      type="text"
      value={query ?? ""}
      onChange={(e) =>
        navigate({
          search: (prev) => ({ ...prev, query: e.target.value || undefined }),
        })
      }
      placeholder="Search flowers..."
    />
  )
}
```

Notice the `query: e.target.value || undefined` pattern. When the input is cleared, we set the param to `undefined` rather than an empty string. This removes it from the URL entirely — `/products` instead of `/products?query=` — keeping URLs clean.

## Building the Server Function for Search

Now let's build the server-side logic. We need a server function that accepts optional search parameters and builds a database query dynamically:

```typescript
import { createServerFn } from "@tanstack/react-start"
import { db } from "@/database/db"
import { products } from "@/database/schema"
import { ilike, eq, and } from "drizzle-orm"

const searchProducts = createServerFn({ method: "GET" })
  .validator((params: { query?: string; category?: string }) => params)
  .handler(async ({ data: params }) => {
    const conditions = []

    if (params.query) {
      conditions.push(ilike(products.name, `%${params.query}%`))
    }
    if (params.category) {
      conditions.push(eq(products.category, params.category))
    }

    return db.select().from(products).where(and(...conditions))
  })
```

Let's examine the key pieces:

### `ilike` — Case-Insensitive Pattern Matching

The `ilike` function generates a SQL `ILIKE` clause — PostgreSQL's case-insensitive version of `LIKE`:

```sql
WHERE name ILIKE '%roses%'
```

The `%` characters are **wildcards** that match any sequence of characters. So `%roses%` matches "Red Roses", "ROSES", "Beautiful roses bouquet", and anything else containing "roses" regardless of case.

This is the standard approach for simple text search. For more advanced search needs (typo tolerance, relevance ranking, stemming), you would use PostgreSQL's full-text search features or a dedicated search engine like Meilisearch — but `ILIKE` is perfect for getting started.

### `eq` — Exact Match

The `eq` function generates a SQL `WHERE` clause with exact equality:

```sql
WHERE category = 'bouquets'
```

This is ideal for category filters where you want an exact match, not a fuzzy search.

### `and` — Combining Conditions

When both a text query and a category filter are active, you want to find products that match **both** conditions. The `and` function combines multiple conditions with SQL `AND`:

```sql
WHERE name ILIKE '%roses%' AND category = 'bouquets'
```

The clever part of our approach is building the `conditions` array dynamically. If the user only searches by text (no category filter), the array has one element. If they only filter by category, it has one element. If they do both, it has two. If neither is provided, the array is empty — and `and()` with no arguments returns no `WHERE` clause, so all products are returned.

This dynamic condition-building pattern is extremely common in real applications. Almost every search feature needs to combine optional filters.

## Debouncing Search Input

There is a practical problem with the search input we built earlier: it triggers a navigation (and therefore a server function call) on **every keystroke**. If a user types "roses", that is 5 navigations, 5 server function calls, and 5 database queries — most of which are wasted because the user has not finished typing.

**Debouncing** solves this by waiting until the user stops typing before triggering the action:

```typescript
import { useState, useEffect } from "react"

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

Here is how you use it:

```tsx
function SearchInput() {
  const { query } = Route.useSearch()
  const navigate = useNavigate()
  const [inputValue, setInputValue] = useState(query ?? "")
  const debouncedQuery = useDebounce(inputValue, 300)

  useEffect(() => {
    navigate({
      search: (prev) => ({
        ...prev,
        query: debouncedQuery || undefined,
      }),
    })
  }, [debouncedQuery])

  return (
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder="Search flowers..."
    />
  )
}
```

The `300` millisecond delay is a good default — it feels instant to the user but cuts out intermediate keystrokes. If the user types quickly, only the final value triggers a navigation.

## Building the Filter UI

A complete search and filter interface might look like this:

```tsx
function ProductFilters() {
  const { category } = Route.useSearch()
  const navigate = useNavigate()

  const categories = ["bouquets", "singles", "arrangements", "plants"]

  return (
    <div className="flex gap-2">
      <button
        className={!category ? "bg-primary text-white" : "bg-gray-100"}
        onClick={() =>
          navigate({ search: (prev) => ({ ...prev, category: undefined }) })
        }
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          className={category === cat ? "bg-primary text-white" : "bg-gray-100"}
          onClick={() =>
            navigate({ search: (prev) => ({ ...prev, category: cat }) })
          }
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
```

Each button updates the `category` search param, which triggers the loader, which calls the server function with the new filters. The active category is visually highlighted. The "All" button clears the category filter by setting it to `undefined`.

## Your Task

Write a search params validation schema and a server function that searches products by text query and filters by category.

Your code should:
1. Import `createServerFn` from `@tanstack/react-start`
2. Import `ilike`, `eq`, and `and` from `drizzle-orm`
3. Create a server function that accepts `{ query?: string; category?: string }`
4. Use `ilike` for text search on the product name when `query` is provided
5. Use `eq` for exact category matching when `category` is provided
6. Combine all conditions using `and()`
7. Query the `products` table with the combined conditions
