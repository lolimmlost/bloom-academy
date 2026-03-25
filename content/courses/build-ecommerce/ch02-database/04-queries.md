---
id: "04-queries"
title: "Writing Queries with Drizzle"
type: "code"
xp: 30
difficulty: 3
order: 4
prerequisites: ["03-defining-schemas"]
hints:
  - "Import eq and asc from 'drizzle-orm' — these are helper functions for comparisons and ordering."
  - "Start your query with db.select().from(products) to select all columns from the products table."
  - "Use .where(eq(products.category, category)) to filter by the category parameter."
  - "Chain .orderBy(asc(products.price)) to sort results from lowest to highest price."
---

# Writing Queries with Drizzle

You have a schema. You have a database connection. Now it is time to actually **read and write data**. This is where Drizzle really shines — its query API feels like writing SQL, but with full TypeScript safety.

## The Database Client

Before writing queries, you need a database client. In a real project, you would set this up in a file like `src/database/db.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client)
```

This creates a single `db` instance that you import wherever you need to run queries. The `postgres` package handles the actual TCP connection to your PostgreSQL server, and `drizzle` wraps it with the type-safe query builder.

## SELECT — Reading Data

The most common operation is reading data. Drizzle's `select` method mirrors SQL's `SELECT` statement.

### Select All Rows

```typescript
import { db } from "./db"
import { products } from "./schema"

// SELECT * FROM products
const allProducts = await db.select().from(products)
```

The return type of `allProducts` is automatically inferred as an array of objects matching your schema. TypeScript knows every field, its type, and whether it can be null.

### Select with Filtering

Use `.where()` to filter results. Drizzle provides helper functions like `eq` (equals), `ne` (not equals), `gt` (greater than), `lt` (less than), `like`, and more.

```typescript
import { eq } from "drizzle-orm"

// SELECT * FROM products WHERE category = 'bouquets'
const bouquets = await db
  .select()
  .from(products)
  .where(eq(products.category, "bouquets"))
```

### Combining Conditions

Use `and()` and `or()` to combine multiple conditions:

```typescript
import { and, eq, gt } from "drizzle-orm"

// SELECT * FROM products WHERE category = 'bouquets' AND price > 3000
const premiumBouquets = await db
  .select()
  .from(products)
  .where(
    and(
      eq(products.category, "bouquets"),
      gt(products.price, 3000)
    )
  )
```

### Ordering Results

Use `.orderBy()` with `asc()` or `desc()` to sort results:

```typescript
import { asc, desc } from "drizzle-orm"

// SELECT * FROM products ORDER BY price ASC
const cheapestFirst = await db
  .select()
  .from(products)
  .orderBy(asc(products.price))

// SELECT * FROM products ORDER BY created_at DESC
const newestFirst = await db
  .select()
  .from(products)
  .orderBy(desc(products.createdAt))
```

### Limiting Results

Use `.limit()` and `.offset()` for pagination:

```typescript
// SELECT * FROM products LIMIT 10 OFFSET 20
const page3 = await db
  .select()
  .from(products)
  .limit(10)
  .offset(20)
```

### Selecting Specific Columns

You do not always need every column. Pass an object to `.select()` to pick only what you need:

```typescript
// SELECT name, price FROM products
const namesAndPrices = await db
  .select({
    name: products.name,
    price: products.price,
  })
  .from(products)
```

The return type narrows automatically — `namesAndPrices` is typed as `{ name: string; price: number }[]`.

## INSERT — Creating Data

To add new rows, use `db.insert()`:

```typescript
// INSERT INTO products (id, name, description, price, category)
// VALUES ('...', 'Rose Bouquet', 'A dozen red roses', 4999, 'bouquets')
await db.insert(products).values({
  id: "prod_001",
  name: "Rose Bouquet",
  description: "A dozen long-stem red roses, hand-tied with eucalyptus",
  price: 4999,
  category: "bouquets",
})
```

Columns with defaults (like `inStock` and `createdAt`) are optional — the database fills them in automatically.

You can also insert multiple rows at once by passing an array:

```typescript
await db.insert(products).values([
  { id: "prod_001", name: "Rose Bouquet", description: "...", price: 4999, category: "bouquets" },
  { id: "prod_002", name: "Tulip Bundle", description: "...", price: 2999, category: "bouquets" },
])
```

### Returning Inserted Data

Add `.returning()` to get back the full row (including generated defaults):

```typescript
const [newProduct] = await db
  .insert(products)
  .values({ ... })
  .returning()
```

## UPDATE — Modifying Data

To change existing rows, use `db.update()`:

```typescript
import { eq } from "drizzle-orm"

// UPDATE products SET price = 3999 WHERE id = 'prod_001'
await db
  .update(products)
  .set({ price: 3999 })
  .where(eq(products.id, "prod_001"))
```

**Always include a `.where()` clause on updates.** Without one, you will update every row in the table — which is rarely what you want.

## DELETE — Removing Data

To remove rows, use `db.delete()`:

```typescript
import { eq } from "drizzle-orm"

// DELETE FROM products WHERE id = 'prod_001'
await db
  .delete(products)
  .where(eq(products.id, "prod_001"))
```

Like updates, **always include a `.where()` clause** unless you intentionally want to delete everything.

## The Helper Functions

Drizzle's filter functions live in the `drizzle-orm` package (not `drizzle-orm/pg-core`). Here are the ones you will use most:

| Function | SQL Equivalent | Example |
|---|---|---|
| `eq(col, val)` | `col = val` | `eq(products.id, "prod_001")` |
| `ne(col, val)` | `col != val` | `ne(products.category, "sale")` |
| `gt(col, val)` | `col > val` | `gt(products.price, 5000)` |
| `lt(col, val)` | `col < val` | `lt(products.price, 2000)` |
| `gte(col, val)` | `col >= val` | `gte(products.price, 1000)` |
| `lte(col, val)` | `col <= val` | `lte(products.price, 10000)` |
| `like(col, pat)` | `col LIKE pat` | `like(products.name, "%rose%")` |
| `and(...conds)` | `a AND b` | `and(eq(...), gt(...))` |
| `or(...conds)` | `a OR b` | `or(eq(...), eq(...))` |
| `asc(col)` | `ORDER BY col ASC` | `asc(products.price)` |
| `desc(col)` | `ORDER BY col DESC` | `desc(products.createdAt)` |

## Putting It All Together

In a real application, you would organize your queries into functions:

```typescript
import { eq, asc, and, gt } from "drizzle-orm"
import { db } from "./db"
import { products } from "./schema"

export async function getAllProducts() {
  return db.select().from(products).orderBy(asc(products.name))
}

export async function getProductById(id: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
  return product
}

export async function getProductsByCategory(category: string) {
  return db
    .select()
    .from(products)
    .where(eq(products.category, category))
    .orderBy(asc(products.price))
}

export async function getAffordableProducts(maxPriceCents: number) {
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.inStock, true),
        gt(products.price, 0),
        lte(products.price, maxPriceCents)
      )
    )
    .orderBy(asc(products.price))
}
```

Each function is fully type-safe. If you try to compare `products.price` with a string, TypeScript will catch it at compile time.

## Your Task

Write a function called `getProductsByCategory` that:

1. Accepts a `category` parameter (string)
2. Selects all columns from the `products` table
3. Filters to only products matching that category
4. Orders results by price in ascending order (cheapest first)
5. Returns the query result

You will need to import `eq` and `asc` from `"drizzle-orm"`, and assume `db` and `products` are available from `"./db"` and `"./schema"`.
