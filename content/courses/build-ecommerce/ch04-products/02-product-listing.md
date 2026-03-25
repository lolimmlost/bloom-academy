---
id: "02-product-listing"
title: "Product Listing Page"
type: "code"
xp: 30
difficulty: 3
order: 2
prerequisites: ["01-server-functions"]
hints:
  - "Use createServerFn with 'GET' to define a function that queries all products."
  - "Call db.select().from(products) inside the server function handler."
  - "Use Tailwind's grid utility classes: grid, grid-cols-1, md:grid-cols-3, gap-6."
  - "Map over the products array and render a card for each one with the product name and price."
---

# Product Listing Page

Every e-commerce store starts with the same fundamental page: a grid of products that invites customers to browse and explore. In this lesson, you will build the product listing page for Indigo Sun Florals — combining a server function to fetch data with a responsive grid layout to display it.

## Fetching Products with a Server Function

In the previous lesson, you learned how server functions bridge the gap between your client components and the database. Now let's put that knowledge into practice.

The pattern is straightforward:

1. Define a server function that queries the `products` table
2. Use that function in a route loader
3. Render the data in a component

Here is the server function:

```typescript
import { createServerFn } from "@tanstack/react-start"
import { db } from "@/database/db"
import { products } from "@/database/schema"

const fetchProducts = createServerFn({ method: "GET" }).handler(async () => {
  return db.select().from(products)
})
```

This queries every row from the `products` table. In a production app, you would add pagination (fetching 20 products at a time instead of all of them), but for now, fetching everything keeps the code simple and lets us focus on the fundamentals.

## Wiring It Up with a Route Loader

To ensure products are loaded before the page renders, we use a **loader**:

```typescript
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/products")({
  loader: () => fetchProducts(),
  component: ProductsPage,
})
```

When a user navigates to `/products`, TanStack Start calls the loader, which calls the server function, which queries the database. By the time `ProductsPage` renders, the data is ready and waiting.

## Building a Responsive Product Grid

Now for the visual part. We want products displayed in a grid that adapts to screen size:

- **Mobile** (small screens): 1 column — products stack vertically
- **Tablet** (medium screens): 2 columns
- **Desktop** (large screens): 3 or more columns

Tailwind CSS makes responsive grids remarkably simple:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {products.map((product) => (
    <div key={product.id} className="border rounded-lg p-4">
      <h3 className="font-semibold">{product.name}</h3>
      <p className="text-gray-600">${(product.price / 100).toFixed(2)}</p>
    </div>
  ))}
</div>
```

Let's unpack the Tailwind classes:

- **`grid`** — Enables CSS Grid layout
- **`grid-cols-1`** — Start with 1 column (mobile-first)
- **`md:grid-cols-2`** — At medium screens (768px+), switch to 2 columns
- **`lg:grid-cols-3`** — At large screens (1024px+), switch to 3 columns
- **`gap-6`** — Adds 1.5rem (24px) of spacing between grid items

The `md:` and `lg:` prefixes are Tailwind's **responsive modifiers**. Tailwind uses a mobile-first approach — styles without a prefix apply to all screen sizes, and prefixed styles only kick in at that breakpoint and above.

## Why Store Prices in Cents

You might have noticed `(product.price / 100).toFixed(2)` in the code above. Why divide by 100?

In e-commerce, prices are almost always stored as **integers representing cents** (or the smallest unit of whatever currency you are using). A product that costs $29.99 is stored as `2999` in the database.

Why not just store `29.99` as a decimal? Because **floating-point arithmetic is unreliable for money**:

```javascript
0.1 + 0.2 === 0.3 // false! JavaScript says 0.30000000000000004
```

If your e-commerce calculations are off by even a fraction of a cent, those errors compound across thousands of transactions. Storing prices as integers eliminates this problem entirely — integer arithmetic is always exact.

When you display the price to users, you divide by 100 and format it: `(2999 / 100).toFixed(2)` gives you `"29.99"`.

## Product Card Design

A good product card communicates essential information at a glance. For our flower shop, each card should show:

- **Product name** — What the customer is buying
- **Price** — How much it costs
- **Visual hierarchy** — The name should be prominent (bold/semibold), the price slightly less so

As the app grows, you would add product images, ratings, "Add to Cart" buttons, and sale badges. But starting with the essentials keeps things clean and lets you iterate from a solid foundation.

## Putting It All Together

The complete flow looks like this:

```
User visits /products
  → Route loader calls fetchProducts()
    → Server function queries the database
      → Database returns product rows
    → Data is serialized and sent to the client
  → ProductsPage renders with products available via useLoaderData()
    → Products are mapped into a responsive grid of cards
```

Every step is type-safe. If you add a new column to the products table, Drizzle updates the TypeScript types, and your component immediately knows about the new field. If you remove a column that a component references, TypeScript catches the error at compile time. This end-to-end safety is one of the biggest advantages of the TanStack Start + Drizzle combination.

## Your Task

Write a server function that fetches all products from the database, and a `ProductGrid` component that renders them in a responsive grid.

Your code should:
1. Import `createServerFn` from `@tanstack/react-start`
2. Import `db` and `products` from the database modules
3. Create a server function using `createServerFn` that calls `db.select().from(products)`
4. Export a `ProductGrid` component that accepts a `products` array as a prop
5. Render products in a grid layout using CSS Grid
6. Display each product's `name` and `price`
